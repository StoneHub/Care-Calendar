declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
  }
  
  export type Icon = ComponentType<IconProps>;
  
  export const Bell: Icon;
  export const Calendar: Icon;
  export const CalendarCheck: Icon;
  export const Check: Icon;
  export const Clock: Icon;
  export const Edit: Icon;
  export const Home: Icon;
  export const Menu: Icon;
  export const MessageSquare: Icon;
  export const Settings: Icon;
  export const User: Icon;
  export const Users: Icon;
  export const X: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Plus: Icon;
  export const Info: Icon;
  export const Trash: Icon;
  export const Mail: Icon;
  export const Notification: Icon;
  export const CheckCircle: Icon;
  export const AlertTriangle: Icon;
  export const MoreVertical: Icon;
}