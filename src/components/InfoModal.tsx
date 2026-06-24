import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

type InfoModalProps = {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
};

export default function InfoModal({
  visible,
  title,
  message,
  buttonText = 'OK',
  onClose,
}: InfoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1F1F1F',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: '#555555',
              marginBottom: 20,
              lineHeight: 22,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#0B6B2B',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            >
              {buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}