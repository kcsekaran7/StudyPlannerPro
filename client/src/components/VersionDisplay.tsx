import packageJson from '@/../../package.json';

export function VersionDisplay() {
  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400">
      v{packageJson.version}
    </div>
  );
}
