export default function Skeleton({ width = '100%', height = 16, borderRadius = 6, count = 1 }) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(
      <div
        key={i}
        style={{
          width, height, borderRadius,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }}
      />
    );
  }
  return <>{items}</>;
}
