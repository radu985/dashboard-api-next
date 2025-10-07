// /app/api/caselink/route.ts
import { NextResponse } from 'next/server';
import { casesStore, type CaseItem } from "@/lib/casesStore"; // 🚨 Import your actual store

// --- Utility Functions using the actual casesStore ---

/**
 * Updates the link for a case in the server's in-memory store.
 * @param id The case ID.
 * @param url The confirmation URL.
 * @returns The updated CaseItem or null if not found.
 */
async function updateCaseLink(id: string, url: string): Promise<CaseItem | null> {
    const allCases = await casesStore.list();
    const caseIndex = allCases.findIndex(c => c.id === id);

    if (caseIndex !== -1) {
        allCases[caseIndex].confirm_url = url;
        
        // ⚠️ NOTE: Since casesStore.list() returns a reference to the array 
        // in memory, modifying it here updates the server's state for the next GET/POST.
        return allCases[caseIndex];
    }
    return null;
}

/**
 * Retrieves a case's current status (including its link) from the server store.
 * @param id The case ID.
 * @returns The CaseItem or null if not found.
 */
async function getCaseLinkStatus(id: string): Promise<CaseItem | null> {
    const allCases = await casesStore.list();
    return allCases.find(c => c.id === id) || null;
}

// ---------------------------------------------------------------------

/**
 * Handles GET requests to check the confirmation link status for a single case.
 * URL: /api/caselink?caseId=123
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
        return NextResponse.json(
            { error: 'Missing caseId query parameter.' }, 
            { status: 400 }
        );
    }

    // 1. Get status from the real (though transient) server store
    const caseStatus = await getCaseLinkStatus(caseId);

    if (!caseStatus) {
        return NextResponse.json(
            { error: `Case with ID ${caseId} not found in store.` }, 
            { status: 404 }
        );
    }

    // 2. Return the minimal data needed for the client update
    return NextResponse.json({ 
        id: caseStatus.id,
        confirm_url: caseStatus.confirm_url // Will be "" or the assigned URL
    }, { status: 200 });
}

/**
 * Handles POST requests to dynamically assign a confirmation link to a case.
 * URL: /api/caselink
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { caseId, link } = body;

        if (!caseId || !link) {
            return NextResponse.json(
                { error: 'Missing caseId or link in request body.' }, 
                { status: 400 }
            );
        }

        // 3. Update the link in the real server store
        const updatedCase = await updateCaseLink(caseId, link);

        if (!updatedCase) {
            return NextResponse.json(
                { error: `Case with ID ${caseId} not found in store.` }, 
                { status: 404 }
            );
        }
        
        console.log(`[App Router API] Successfully set link for Case ${caseId}.`);

        return NextResponse.json({ 
            message: 'Case link updated successfully.', 
            case: updatedCase 
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error processing POST /api/caselink:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' }, 
            { status: 500 }
        );
    }
}