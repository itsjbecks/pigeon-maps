import React from 'react';
import { PigeonProps } from '../types';
interface MarkerProps extends PigeonProps {
    color?: string;
    payload?: any;
    width?: number;
    height?: number;
    hover?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onClick?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }: {
        event: any;
        anchor: any;
        payload: any;
    }) => void;
    onContextMenu?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }: {
        event: any;
        anchor: any;
        payload: any;
    }) => void;
    onMouseOver?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }: {
        event: any;
        anchor: any;
        payload: any;
    }) => void;
    onMouseOut?: ({ event: HTMLMouseEvent, anchor: Point, payload: any }: {
        event: any;
        anchor: any;
        payload: any;
    }) => void;
}
export declare const Marker: React.FC<MarkerProps>;
export {};
