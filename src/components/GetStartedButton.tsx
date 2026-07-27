import { Text } from "@/components/ui/text";
import { ArrowRight } from 'lucide-react-native'
import { Platform } from "react-native";

const GetStartedButton = ({ primaryForegroundColor }: { primaryForegroundColor: string }) => {
    return (
        <>
            <Text
                className="font-semibold text-primary-foreground text-xl"
            >
                {Platform.OS === "android" ? "Choose Folder & Start" : "Get Started"}
            </Text>
            <ArrowRight color={primaryForegroundColor} size={20} strokeWidth={2} />
        </>
    )
}

export default GetStartedButton
