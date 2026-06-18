import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

type ConfirmDeleteModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  visible,
  title = 'Eliminar gasto',
  message = '¿Seguro que querés eliminar este gasto? Esta acción no se puede deshacer.',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
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

          {loading ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <ActivityIndicator size="small" />
              <Text style={{ color: '#555555' }}>Eliminando...</Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: '#0B6B2B',
                    fontWeight: 'bold',
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onConfirm}
                style={{
                  backgroundColor: '#B00020',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                  }}
                >
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}