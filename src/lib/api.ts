import { z } from "zod";

export function formatError(err: Error): string {
    if (err instanceof z.ZodError) {
        return "ZodError: " + z.prettifyError(err);
    } else {
        let msg = String(err);
        if (err.cause instanceof Error) {
            msg += `\nCaused by: ${formatError(err.cause)}`;
        }
        return msg;
    }
}
