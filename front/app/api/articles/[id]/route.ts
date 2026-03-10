import { NextResponse } from "next/server";
import { getFullArticlePayload } from "@/lib/law-reader";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const articlePayload = getFullArticlePayload(id);

        if (!articlePayload) {
            return NextResponse.json(
                { error: `Artículo con ID ${id} no encontrado` },
                { status: 404 }
            );
        }

        return NextResponse.json({ article: articlePayload });
    } catch (error) {
        console.error("Article API Error:", error);
        return NextResponse.json(
            { error: "Error interno al recuperar el contenido legal" },
            { status: 500 }
        );
    }
}
