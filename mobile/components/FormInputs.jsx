import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import tw from "twrnc";
import { useAppTheme } from "@/src/theme/ThemeContext";
import { useResponsive } from "@/constants/responsive";

export const InputField = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    editable = true,
    error,
    rightIcon,
    onRightIconPress,
}) => {
    const { theme } = useAppTheme();
    const { hs, vs, fontScale } = useResponsive();
    return (
        <View style={tw`mb-3`}>
            {label && (
                <Text
                    style={[
                        tw`font-bold mb-1.5 ml-1`,
                        { fontSize: fontScale(14), color: theme.onSurface },
                    ]}
                >
                    {label}
                </Text>
            )}
            <View
                style={[
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 12,
                        borderWidth: 1,
                        paddingHorizontal: hs(16),
                        backgroundColor: theme.surfaceContainerLow,
                        borderColor: error ? theme.error : theme.outlineVariant,
                        height: vs(56),
                    },
                ]}
            >
                {icon && (
                    <MaterialCommunityIcons
                        name={icon}
                        size={hs(20)}
                        color={theme.onSurfaceVariant}
                        style={tw`mr-3`}
                    />
                )}
                <TextInput
                    style={[
                        tw`flex-1`,
                        { fontSize: fontScale(16), color: editable ? theme.onSurface : theme.onSurfaceVariant },
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.onSurfaceVariant}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    editable={editable}
                    autoCapitalize="none"
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={tw`p-1`}>
                        <MaterialCommunityIcons
                            name={rightIcon}
                            size={hs(22)}
                            color={theme.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text
                    style={[
                        tw`mt-1 ml-1`,
                        { fontSize: fontScale(12), color: theme.error },
                    ]}
                >
                    {error}
                </Text>
            )}
        </View>
    );
};

export const CustomSelect = ({
    label,
    value,
    placeholder,
    options,
    onSelect,
    visible,
    setVisible,
    error,
}) => {
    const { theme } = useAppTheme();
    const { hs, vs, fontScale } = useResponsive();
    return (
        <View style={tw`mb-3 z-50`}>
            {label && (
                <Text
                    style={[
                        tw`font-bold mb-1.5 ml-1`,
                        { fontSize: fontScale(14), color: theme.onSurface },
                    ]}
                >
                    {label}
                </Text>
            )}
            <TouchableOpacity
                onPress={() => setVisible(true)}
                style={[
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 12,
                        borderWidth: 1,
                        paddingHorizontal: hs(16),
                        backgroundColor: theme.surfaceContainerLow,
                        borderColor: error ? theme.error : theme.outlineVariant,
                        height: vs(56),
                    },
                ]}
            >
                <Text
                    style={[
                        tw`flex-1`,
                        { fontSize: fontScale(16), color: value ? theme.onSurface : theme.onSurfaceVariant },
                    ]}
                >
                    {value || placeholder}
                </Text>
                <MaterialCommunityIcons
                    name="chevron-down"
                    size={hs(22)}
                    color={theme.onSurfaceVariant}
                />
            </TouchableOpacity>
            {error && (
                <Text
                    style={[
                        tw`mt-1 ml-1`,
                        { fontSize: fontScale(12), color: theme.error },
                    ]}
                >
                    {error}
                </Text>
            )}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={tw`flex-1 justify-center items-center bg-black/40`}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={[
                            tw`rounded-2xl p-4`,
                            { backgroundColor: theme.surface, width: hs(320), maxHeight: hs(384) },
                        ]}
                    >
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect(item);
                                        setVisible(false);
                                    }}
                                    style={[
                                        tw`rounded-xl mb-1`,
                                        {
                                            paddingHorizontal: hs(16),
                                            paddingVertical: vs(16),
                                            backgroundColor:
                                                value === item
                                                    ? theme.primaryContainer
                                                    : "transparent",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            tw`font-bold`,
                                            {
                                                fontSize: fontScale(16),
                                                color:
                                                    value === item
                                                        ? theme.primary
                                                        : theme.onSurface,
                                            },
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};
