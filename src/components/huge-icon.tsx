import { createElement } from "react";

type IconData = [string, Record<string, string>][];

export function HIcon({ icon, size = 24, className = "" }: { icon: IconData; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {icon.map((item) => {
        const [tag, props] = item;
        // Filter out the 'key' prop since createElement handles keys differently
        const { key, ...svgProps } = props;
        return createElement(tag, { ...svgProps, key: key ?? `${tag}-${JSON.stringify(svgProps).slice(0, 20)}` });
      })}
    </svg>
  );
}
