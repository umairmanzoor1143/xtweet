/**
 * POST /api/replies
 * Body: { tweetText: string, author?: string, count?: number, textLimit?: number }
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const tweetText = typeof body.tweetText === 'string' ? body.tweetText.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : 'the author';
    const count = Math.min(6, Math.max(1, Number(body.count) || 3));
    const textLimitRaw = Number(body.textLimit);
    const textLimit = Number.isFinite(textLimitRaw) && textLimitRaw >= 40 && textLimitRaw <= 280 ? Math.floor(textLimitRaw) : 280;

    if (!tweetText) {
      return new Response(JSON.stringify({ error: 'Please provide a tweet to reply to.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY on server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You generate concise, natural-sounding replies to X (formerly Twitter) posts. 
First, understand the post's tone and context (e.g., serious, humorous, reflective, promotional, educational) and match that tone in your reply.
Write exactly ONE sentence between 20-100 characters (or up to ${textLimit} characters max).
Keep it natural, direct, conversational, and engaging.
No emojis, no hashtags, no quotes, no symbols ;:!, no lists.
Do not add new information; respond only to what is provided in the tweet.
If the post is unclear, ask one brief clarifying question within the character limit.
Output only the reply text, nothing else.`;

    const userPrompt = `Generate a thoughtful reply to this tweet by ${author}:

"${tweetText}"

Generate exactly ${count} different, varied, and creative replies. Each reply should be unique in tone or perspective.
Output each reply on a new line, numbered 1-${count}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        presence_penalty: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: errorData?.error?.message || 'Failed to generate replies' }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the numbered replies
    const replies = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d+\.\s/.test(line))
      .map((line) => line.replace(/^\d+\.\s+/, '').trim())
      .filter((reply) => reply.length > 0 && reply.length <= textLimit);

    return new Response(
      JSON.stringify({
        replies: replies.map((text) => ({ text })),
        count: replies.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating replies:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
