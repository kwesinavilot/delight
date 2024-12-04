import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, FileText, PenTool, Wand2, LucideIcon } from "lucide-react";

type Feature = 'summary' | 'write' | 'rewrite';

const iconMap: { [key: string]: LucideIcon } = {
    FileText,
    PenTool,
    Wand2,
};

const Popup: React.FC = () => {
    const [hasSelection, setHasSelection] = useState(false);

    const menus = [
        { title: "Summarize Page", icon: "FileText", feature: "summary" as Feature, disabled: false },
        { title: "Write", icon: "PenTool", feature: "write" as Feature, disabled: false },
        { title: "Rewrite", icon: "Wand2", feature: "rewrite" as Feature, disabled: !hasSelection },
    ];

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

    const openSidePanel = async (feature: Feature) => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        console.log('Attempting to open side panel with feature:', feature);

        // First set the options
        await chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: '/sidepanel.html',
            enabled: true
        });

        // Then open the panel
        await chrome.sidePanel.open({ tabId: tab.id });

        chrome.runtime.sendMessage({
            action: 'openSidePanel',
            feature,
            tabId: tab.id
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
            } else {
                console.log('Message sent successfully');
            }
        });
    };

    return (
        <div className="w-64 bg-background text-foreground">
            {/* Header */}
            <div className="p-2 flex items-center space-x-2 mb-6">
                <Avatar>
                    <AvatarImage src="/icons/delightful-1.jpg" />
                    <AvatarFallback>
                        <Sparkles className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                </Avatar>

                <h1 className="text-lg font-semibold">Delight</h1>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
                {menus.map((menu) => {
                    const IconComponent = iconMap[menu.icon];
                    return (
                        <Button
                            key={menu.title}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => openSidePanel(menu.feature)}
                            disabled={menu.disabled}
                        >
                            <IconComponent className="mr-2 h-4 w-4" />
                            {menu.title}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default Popup; 