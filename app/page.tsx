"use client";

import { useEffect, useState, useCallback } from "react";
import type { CaseItem } from "@/lib/casesStore";
import { Search, FolderOpen, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CaseCard } from "@/components/case-card";
import { CaseDetailModal } from "@/components/case-detail-modal";
import { Button } from "@/components/ui/button"; 

export default function CaseDashboard() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); 
  
  const LOCAL_STORAGE_KEY = 'cachedCaseData';
  const POLLING_INTERVAL = 10000; // 10 seconds

  // --- Utility Functions ---

  const saveCasesToLocalStorage = useCallback((currentCases: CaseItem[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentCases));
    }
  }, []);

  const loadCachedCases = useCallback(() => {
    if (typeof window === 'undefined') return [];
    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cachedData) {
      try {
        const parsedCases = JSON.parse(cachedData);
        if (Array.isArray(parsedCases)) {
          return parsedCases;
        }
      } catch (e) {
        console.error("Failed to parse local storage case data.");
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    return [];
  }, []);

  // --- Initial Data Fetching (Full list from /api/cases) ---

  const fetchCases = useCallback(async () => {
    // Only set polling status for visualization, not blocking UI flow
    setIsPolling(true); 
    
    try {
      const r = await fetch("/api/cases");
      const d = await r.json();
      
      const newCases = Array.isArray(d?.cases) ? d.cases : (Array.isArray(d) ? d : []);
      
      // DEFENSIVE CACHING: Only update if server returns non-empty data.
      if (newCases.length > 0) {
          setCases(newCases);
          saveCasesToLocalStorage(newCases); 
      }

    } catch (error) {
      console.error("Error fetching cases from API:", error);
    } finally {
      setIsPolling(false);
      setIsLoadingInitial(false);
    }
  }, [saveCasesToLocalStorage]);

  // --- Polling for Link Updates (Hits the new /api/caselink?caseId=XXX) ---

  const pollForLinkUpdates = useCallback(async () => {
    setIsPolling(true);
    
    // Identify which cases need checking (those without a confirm_url)
    const casesToPoll = cases.filter(c => !c.confirm_url);
    
    if (casesToPoll.length === 0) {
        setIsPolling(false);
        return;
    }

    let updatedCasesCount = 0;
    let newCasesState = [...cases]; // Create a mutable copy of the current state

    for (const caseItem of casesToPoll) {
        try {
            // Make the GET request to the new endpoint
            const r = await fetch(`/api/caselink?caseId=${caseItem.id}`);
            
            // Continue if the case is not found or other API error
            if (!r.ok) continue; 
            
            const { id, confirm_url } = await r.json();

            // If a new link is found, update the local state copy
            if (confirm_url && confirm_url !== caseItem.confirm_url) {
                const index = newCasesState.findIndex(c => c.id === id);
                if (index !== -1) {
                    newCasesState[index] = { ...newCasesState[index], confirm_url };
                    updatedCasesCount++;
                }
            }
        } catch (error) {
            console.error(`Error polling case ${caseItem.id}:`, error);
        }
    }

    // Update the component state and localStorage only once if changes occurred
    if (updatedCasesCount > 0) {
        setCases(newCasesState);
        saveCasesToLocalStorage(newCasesState); // Save the newly updated links to local cache
    }

    setIsPolling(false);
}, [cases, saveCasesToLocalStorage]);


  // --- Initial Load & Polling Effect ---
  useEffect(() => {
    // 1. Initial Load Logic: 
    
    // Attempt to load from cache immediately to prevent cases from "vanishing"
    const cachedCases = loadCachedCases();
    if (cachedCases.length > 0) {
        setCases(cachedCases);
        setIsLoadingInitial(false); // We have data, so stop initial loading screen
    }
    
    // Always call the full API fetch to get the latest list of cases (in case new ones were added)
    fetchCases();
    
    // 2. Set up the interval for link polling
    const intervalId = setInterval(() => {
        // 🚨 Use the dedicated link poller here
        pollForLinkUpdates(); 
    }, POLLING_INTERVAL);

    // 3. Cleanup
    return () => clearInterval(intervalId);
  }, [fetchCases, loadCachedCases, pollForLinkUpdates]); 


  // --- Filtering Logic (Remains the same) ---
  const filteredCases = cases.filter((caseItem) => {
    const query = searchQuery.toLowerCase();
    return (
      caseItem.title.toLowerCase().includes(query) ||
      caseItem.applicantName.toLowerCase().includes(query) ||
      caseItem.postalCode.includes(query) ||
      caseItem.id.toString().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between"> 
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">
                Case Dashboard
              </h1>
            </div>
            {/* Status Display */}
            <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className={`mr-2 h-4 w-4 ${isPolling ? 'text-green-500 animate-spin' : 'text-gray-400'}`} />
                Aktualisierungs-Check: {POLLING_INTERVAL / 1000}s
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Suche nach Namen, PLZ oder Case-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Loading/Empty State */}
        {isLoadingInitial && cases.length === 0 ? (
             <div className="py-12 text-center">
                <p className="text-muted-foreground">Lade Daten...</p>
             </div>
        ) : filteredCases.length === 0 ? (
             <div className="py-12 text-center">
                <p className="text-muted-foreground">Keine Cases gefunden.</p>
             </div>
        ) : (
            /* Cases Grid */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((caseItem) => (
                <CaseCard
                    key={caseItem.id}
                    caseData={caseItem}
                    onViewDetails={() => setSelectedCase(caseItem)}
                />
            ))}
            </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}