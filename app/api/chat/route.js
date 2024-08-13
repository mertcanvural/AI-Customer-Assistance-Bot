import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const systemPrompt = `
1. This platform offers AI-powered interviews tailored for software engineering positions.
2. It helps candidates practice and prepare for real job interviews effectively.
3. The platform covers a wide range of topics including algorithms, data structures, system design, and behavioral questions.
4. Users can access the services through both the website and mobile app.
5. If technical issues arise, guide users to the troubleshooting page or suggest contacting the technical support team.
6. Always maintain user privacy and do not share personal information.
7. If unsure about any information, it's okay to admit it and offer to connect the user with a human representative.

Your goal is to provide accurate information, assist with common inquiries, and ensure a positive experience for all users.
`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    const data = await request.json();

    // Creating the Groq completion stream
    const completion = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data.messages,  // user messages are here
        ],
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}