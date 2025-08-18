import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { analyzeSentiment } from "../../../../lib/claudeApi";
import { v4 as uuidv4 } from 'uuid';
import { SentimentResult } from "../batch-status/types";

async function processBatch(jobId: string, userId: string, texts: any[], file_name?: string) {
    console.log('processBatch called with file_name:', file_name); // Debug log
    const supabase = await createClient();
    const results: SentimentResult[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < texts.length; i++) {
        const textItem = texts[i];
        let text: string;
        let metrics: any = {};

        if (typeof textItem === 'string') {
            text = textItem;
        } else if (typeof textItem === 'object' && textItem.text) {
            text = textItem.text;
            metrics = textItem.metrics || {};
        } else {
            results.push({ id: `item_${i}`, text: "", sentiment: "neutral", confidence: 0, key_phrases: [], processing_time_ms: 0, tokens_used: 0, error: "Invalid text format" });
            failed++;
            continue;
        }

        try {
            const itemStartTime = Date.now();
            const result = await analyzeSentiment({ userId, text });
            const itemProcessingTime = Date.now() - itemStartTime;

            results.push({
                id: `item_${i}`,
                text: text,
                sentiment: result.sentiment,
                confidence: result.confidence,
                key_phrases: result.key_phrases,
                processing_time_ms: itemProcessingTime,
                tokens_used: result.tokens_used,
                metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
            });

            successful++;

            // Save to sentiment_analyses table
            const insertData: any = {
                user_id: userId,
                input_text: text,
                sentiment_result: result,
                analysis_type: 'batch_text',
                tokens_used: result.tokens_used,
                processing_time_ms: itemProcessingTime,
                batch_job_id: jobId,
                ...metrics,
            };

            // Include file_name if provided
            if (file_name) {
                insertData.file_name = file_name;
                console.log('Setting file_name in insertData:', file_name); // Debug log
            } else {
                console.log('No file_name provided for this batch'); // Debug log
            }

            console.log('Inserting analysis with data:', {
                file_name: insertData.file_name,
                has_file_name: !!file_name,
                insertData: JSON.stringify(insertData, null, 2)
            });

            const { data, error: insertError } = await supabase
                .from('sentiment_analyses')
                .insert(insertData)
                .select();

            console.log('Insert result:', { data, error: insertError });

            if (insertError) {
                console.error(`[Batch Job ${jobId}] Failed to save analysis for item ${i}:`, insertError);
                // Optional: Decide if you want to mark this item as failed in the batch results
            }

        } catch (error: any) {
            results.push({ id: `item_${i}`, text: text, sentiment: "neutral", confidence: 0, key_phrases: [], processing_time_ms: 0, tokens_used: 0, error: error.message || "Analysis failed" });
            failed++;
        }

        await supabase.from('batch_jobs').update({ processed_entries: i + 1, results }).eq('job_id', jobId);
    }

    const summary = {
        total_processed: results.length,
        successful: results.filter((r: SentimentResult) => !r.error).length,
        failed: results.filter((r: SentimentResult) => r.error).length,
        total_tokens: results.reduce((acc: number, r: SentimentResult) => acc + (r.tokens_used || 0), 0),
        total_processing_time: results.reduce((acc: number, r: SentimentResult) => acc + (r.processing_time_ms || 0), 0),
        sentiment_distribution: {
            positive: results.filter((r: SentimentResult) => r.sentiment === 'positive').length,
            negative: results.filter((r: SentimentResult) => r.sentiment === 'negative').length,
            neutral: results.filter((r: SentimentResult) => r.sentiment === 'neutral').length,
        },
    };

    await supabase
        .from('batch_jobs')
        .update({ status: 'completed', results, summary })
        .eq('job_id', jobId);
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { texts, file_name } = await request.json();

        console.log('Received request with file_name:', file_name); // Debug log

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json({ error: "Texts array is required" }, { status: 400 });
        }

        const jobId = uuidv4();
        const { error: jobError } = await supabase.from('batch_jobs').insert({
            user_id: user.id,
            job_id: jobId as any, // Supabase client expects string for UUID
            status: 'processing',
            total_entries: texts.length,
            processed_entries: 0,
            file_name: file_name,
        });

        if (jobError) {
            console.error("Error creating batch job:", jobError);
            return NextResponse.json({ error: "Failed to create batch job" }, { status: 500 });
        }

        // Fire and forget
        (async () => {
          console.log('Starting batch process with file_name:', file_name); // Debug log
          await processBatch(jobId, user.id, texts, file_name);
        })();

        return NextResponse.json({ jobId });

    } catch (error) {
        console.error("Batch sentiment analysis error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 
