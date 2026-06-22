import MapView, { Marker } from 'react-native-maps';

type Props = {
  latitude: number;
  longitude: number;
  title?: string;
};

export default function ExpenseMap({ latitude, longitude, title }: Props) {
  return (
    <MapView
      style={{
        width: '100%',
        height: 220,
        borderRadius: 12,
      }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
      />
    </MapView>
  );
}