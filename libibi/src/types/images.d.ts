declare module '*.avif';
declare module '*.bmp';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.webp';
declare module '*.svg' {
  import * as React from 'react';
  const content: string;
  export default content;
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}
