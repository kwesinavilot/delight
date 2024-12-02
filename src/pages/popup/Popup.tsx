import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, PenTool, Wand2 } from "lucide-react";

const Popup: React.FC = () => {
    const [hasSelection, setHasSelection] = useState(false);

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return;
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    const selection = window.getSelection();
                    return selection ? selection.toString().length > 0 : false;
                },
            }, (result) => {
                setHasSelection(result?.[0]?.result || false);
            });
        });
    }, []);

    const openSidePanel = (feature: 'summary' | 'write' | 'rewrite') => {
        chrome.runtime.sendMessage({ action: 'openSidePanel', feature });
    };

    return (
        <div className="w-64 p-4 bg-background text-foreground">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold">Delight</h1>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => openSidePanel('summary')}
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Summarize Page
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => openSidePanel('write')}
                >
                    <PenTool className="mr-2 h-4 w-4" />
                    Write
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => openSidePanel('rewrite')}
                    disabled={!hasSelection}
                >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Rewrite
                </Button>
            </div>
        </div>
    );
};

export default Popup; 