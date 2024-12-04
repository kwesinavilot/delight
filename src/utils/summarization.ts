import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

interface AI {
    summarizer: {
        capabilities: () => Promise<{ available: string }>;
        create: (options: any) => Promise<any>;
    };
}

declare const self: {
    ai: AI;
};

export const getPageContent = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const text = await response.text();
    const dom = new JSDOM(text);
    const article = new Readability(dom.window.document).parse();
    return article?.textContent || '';
};

export const summarizeContent = async (
    content: string, 
    onProgress?: (progress: number) => void
): Promise<string> => {
    if ('ai' in self && 'summarizer' in self.ai) {
        const options = {
            sharedContext: 'This is a general article',
            type: 'key-points',
            format: 'markdown',
            length: 'medium',
        };

        const available = (await self.ai.summarizer.capabilities()).available;
        let summarizer;

        if (available === 'no') {
            console.error("The Summarizer API isn't usable.");
            return 'Summarization not available.';
        }

        if (available === 'readily') {
            summarizer = await self.ai.summarizer.create(options);
        } else {
            summarizer = await self.ai.summarizer.create(options);
            
            // Optional progress tracking
            if (onProgress) {
                // Simulate progress 
                const progressInterval = setInterval(() => {
                    onProgress(Math.random() * 50); // Example progress simulation
                }, 1000);

                try {
                    await summarizer.ready;
                } finally {
                    clearInterval(progressInterval);
                    onProgress(100); // Complete
                }
            } else {
                await summarizer.ready;
            }
        }

        const summary = await summarizer.summarize(content, {
            context: 'This article is intended for a general audience.',
        });

        return summary;
    } else {
        console.error("Summarizer API not supported.");
        return 'Summarization not supported.';
    }
};

export const summarizeContentStreaming = async (content: string): Promise<string> => {
    if ('ai' in self && 'summarizer' in self.ai) {
        const options = {
            sharedContext: 'This is a general article',
            type: 'key-points',
            format: 'markdown',
            length: 'medium',
        };

        const available = (await self.ai.summarizer.capabilities()).available;
        let summarizer;

        if (available === 'no') {
            console.error("The Summarizer API isn't usable.");
            return 'Summarization not available.';
        }

        if (available === 'readily') {
            summarizer = await self.ai.summarizer.create(options);
        } else {
            summarizer = await self.ai.summarizer.create(options);
            await summarizer.ready;
        }

        let result = '';
        const stream = await summarizer.summarizeStreaming(content, {
            context: 'This article is intended for a general audience.',
        });

        for await (const chunk of stream) {
            result += chunk;
            console.log(chunk);
        }

        return result;
    } else {
        console.error("Summarizer API not supported.");
        return 'Summarization not supported.';
    }
}; 