
import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { getAppSettings, AppSettings } from "@/lib/settings";

const WhatsAppChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        getAppSettings().then(setSettings);
    }, []);

    const whatsappLink = settings
        ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`
        : "#";

    return (
        <>
            {/* Floating Icon */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#128C7E]"
                    size="icon"
                >
                    <MessageCircle className="h-8 w-8 text-white" />
                </Button>
            </div>

            {/* Chat Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-[#25D366]" />
                            Chat with Support
                        </DialogTitle>
                        <DialogDescription className="pt-4 text-base">
                            If you have any questions, our team is available 24/7 to assist you with your investments and account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12 text-lg font-semibold"
                            onClick={() => {
                                window.open(whatsappLink, "_blank");
                                setIsOpen(false);
                            }}
                        >
                            Click to Chat on WhatsApp
                        </Button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                        Our live chat is available 24 hours a day.
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default WhatsAppChatBot;
