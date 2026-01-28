import { useState, useCallback, useEffect, useRef } from 'react';
import { useConfidantStore } from '@/lib/store';

export const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const result = event.results[current][0].transcript;
                setTranscript(result);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            setIsListening(true);
            setTranscript('');
            recognitionRef.current.start();
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return { isListening, transcript, startListening, stopListening };
};

export const useVoiceOutput = () => {
    const userProfile = useConfidantStore((state) => state.userProfile);
    const isMuted = useConfidantStore((state) => state.isMuted);

    useEffect(() => {
        if (isMuted && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, [isMuted]);

    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window && !isMuted) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            if (userProfile?.voiceSettings) {
                utterance.pitch = userProfile.voiceSettings.pitch;
                utterance.rate = userProfile.voiceSettings.rate;
            }

            window.speechSynthesis.speak(utterance);
        }
    }, [userProfile, isMuted]);

    return { speak };
};
