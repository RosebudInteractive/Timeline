import React, {
  SyntheticEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { useResizeDetector } from 'react-resize-detector/build/withPolyfill';
import Themes from './theme';
import Header from './header';
import Footer from './footer';
import { Event } from '../types/event';
import { Period } from '../types/period';
import TimeAxis from './time-axis';
import Message from '../detail-message';
import { ActiveItem, VisualItem } from '../types/common';
import './timeline.sass';
import ZoomHandler, { OffsetEnum } from '../helpers/zoom-handler';
import wrap from '../helpers/zoom-container';
import SETTINGS from './settings';

type Props = {
  backgroundImage: string,
  height: number,
  enableToSwitchFS: boolean,
  events: Event.VisualItem[],
  periods: Period.VisualItem[],
  levelLimit: { events: number, periods: number },
  visibilityChecking: boolean,
  elementsOverAxis: boolean,
  // eslint-disable-next-line react/require-default-props
  onFullScreen?: Function,
  // eslint-disable-next-line react/require-default-props
  onCloseFullScreen? : Function,
  // eslint-disable-next-line react/require-default-props
  onChangeOrientation? : Function,
  isDeprecatedBrowser: boolean,
};

let scrollHandlerGuard: boolean = false;

// eslint-disable-next-line react/function-component-definition
export default function Timeline(props: Props): JSX.Element {
  const {
    backgroundImage,
    events,
    periods,
    height,
    levelLimit,
    visibilityChecking,
    elementsOverAxis,
    enableToSwitchFS,
    onFullScreen,
    onCloseFullScreen,
    onChangeOrientation,
    isDeprecatedBrowser,
  } = props;

  const [fsEnable, setFsEnable] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [zoomSliderStopped, setZoomSliderStopped] = useState<boolean>(true);
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isVertical, setIsVertical] = useState<boolean>(false);
  const [activeInViewport, setActiveInViewport] = useState<boolean>(false);
  const [offsetDefined, setOffsetDefined] = useState<boolean>(false);
  const horizontalContainerRef = useRef<HTMLDivElement>(null);

  const { width } = useResizeDetector({ targetRef: horizontalContainerRef });

  const openFullScreen = () => {
    setFsEnable(true);
    if (onFullScreen) onFullScreen();
  };

  const closeFullScreen = () => {
    setFsEnable(false);
    if (onCloseFullScreen) onCloseFullScreen();
  };

  const calcOffsetForEvent = (event: VisualItem): number => {
    if (horizontalContainerRef.current) {
      const { left } = event;
      const { scrollLeft } = horizontalContainerRef.current;
      return left + SETTINGS.horizontalPadding - scrollLeft;
    }

    return 0;
  };

  const calcOffsetForPeriod = (period: VisualItem): number => {
    if (horizontalContainerRef.current) {
      const { left, width: periodWidth } = period;
      const { scrollLeft } = horizontalContainerRef.current;

      let startValue = left + SETTINGS.horizontalPadding - scrollLeft;
      let endValue = startValue + periodWidth;

      if (startValue < 0) startValue = 0;
      if (endValue > (width || 0)) endValue = width || 0;

      return startValue + (endValue - startValue) / 2;
    }

    return 0;
  };

  const calculateOffset = (active: ActiveItem): number => {
    if (active) {
      switch (active.type) {
        case 'event': return calcOffsetForEvent(active.item);

        case 'period': return calcOffsetForPeriod(active.item);

        default: return 0;
      }
    }

    return 0;
  };

  const defineOffset = (active: ActiveItem) => {
    const xValue = calculateOffset(active);
    if (xValue) {
      ZoomHandler.setOffset(xValue);
      setOffsetDefined(true);
      setActiveInViewport(true);
    }
  };

  const adjustActiveItem = () => {
    if (activeItem) {
      scrollHandlerGuard = true;
      if (!offsetDefined) defineOffset(activeItem);

      if (activeItem.type === 'event') {
        const newOffset = calculateOffset(activeItem);
        ZoomHandler.adjustForNewOffset(newOffset, zoom);
      } else {
        ZoomHandler.adjustForZoom(zoom);
        defineOffset(activeItem);
      }
      setTimeout(() => {
        scrollHandlerGuard = false;
      }, 0);
    }
  };

  // const getEventInViewPort = (item: VisualItem, scrollPosition: number): boolean => {
  //   const { left, width: itemWidth } = item;
  //   const xValue = left + SETTINGS.horizontalPadding - scrollPosition;
  //   return ((xValue + itemWidth) > 0) && (xValue < (width || 0));
  // };
  //
  // const getPeriodInViewPort = (item: VisualItem, scrollPosition: number): boolean => {
  //   const { left, width: itemWidth } = item;
  //   const xValue = left + SETTINGS.horizontalPadding - scrollPosition;
  //   return ((xValue + itemWidth) > 0) && (xValue < (width || 0));
  // };
  //
  // const getActiveItemInViewPort = (scrollPosition: number): boolean => {
  //   if (activeItem) {
  //     switch (activeItem.type) {
  //       case 'event': return getEventInViewPort(activeItem.item, scrollPosition);
  //
  //       case 'period': return calcOffsetForPeriod(activeItem.item);
  //
  //       default: return false;
  //     }
  //   }
  //
  //   return false;
  // }

  const fixActiveItemOffset = (newScrollPosition: number) => {
    if (activeItem) {
      const { left, width: itemWidth } = activeItem.item;
      const xValue = left + SETTINGS.horizontalPadding - newScrollPosition;
      const visible = ((xValue + itemWidth) > 0) && (xValue < (width || 0));

      if (visible !== activeInViewport) {
        if (!visible) {
          setOffsetDefined(false);
          ZoomHandler.setOffset(OffsetEnum.CENTER);
        }

        setActiveInViewport(visible);
      }

      if (visible && !scrollHandlerGuard) {
        if (offsetDefined) {
          const newOffset = calculateOffset(activeItem);
          ZoomHandler.setOffset(newOffset);
        } else {
          defineOffset(activeItem);
        }
      }
    }
  };

  const onZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, []);

  const onZoomSliderStop = useCallback((stopped: boolean) => {
    setZoomSliderStopped(stopped);
  }, []);

  const containerHeight = useMemo(() => (height ? height - 8 : 0), [levelLimit, height]);

  const itemClickHandler = useCallback(({ type, id, item }) => {
    if (!activeItem || (activeItem.type !== type) || (activeItem.id !== id)) {
      setActiveItem({ type, id, item });
    }

    defineOffset({ type, id, item });
  }, [activeItem]);

  const messageClose = () => {
    setActiveItem(null);
    setActiveInViewport(false);
    ZoomHandler.setOffset(OffsetEnum.CENTER);
    setOffsetDefined(false);
  };

  useEffect(() => {
    ZoomHandler.setWidth(width || 0);
    setIsVertical(SETTINGS.isVerticalViewport(width || 0));
    if (horizontalContainerRef.current) {
      const { scrollLeft } = horizontalContainerRef.current;
      fixActiveItemOffset(scrollLeft);
    }
  }, [width]);

  // useEffect(() => {
  //   if (!offsetDefined) {
  //     ZoomHandler.setOffset(OffsetEnum.CENTER);
  //   }
  // }, [offsetDefined]);

  useEffect(() => {
    if (horizontalContainerRef.current) {
      ZoomHandler.setContainer(wrap(horizontalContainerRef.current));
      ZoomHandler.setWidth(horizontalContainerRef.current.clientWidth);
      setContainerWidth(horizontalContainerRef.current.clientWidth);
    }
  }, [horizontalContainerRef]);

  // useEffect(() => {
  //   setIsVertical(SETTINGS.isVerticalViewport(containerWidth));
  // }, [containerWidth]);

  useLayoutEffect(() => {
    if (activeItem && activeInViewport) {
      adjustActiveItem();
    } else {
      ZoomHandler.adjustForZoom(zoom);
    }
  }, [zoom]);

  const scrollHandler = (e: SyntheticEvent<HTMLElement>) => {
    // @ts-ignore
    const pos = (e.nativeEvent.target && e.nativeEvent.target.scrollLeft) || 0;
    ZoomHandler.setScrollPosition(pos);
    fixActiveItemOffset(pos);
  };

  const background = useMemo(() : React.CSSProperties => ({
    backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.44), rgba(0, 0, 0, 0.58)),url(${backgroundImage})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }), [backgroundImage]);

  const containerStyle = useMemo(() : React.CSSProperties => ({ height }), [height]);

  useEffect(() => {
    if (onChangeOrientation) onChangeOrientation(isVertical);
  }, [isVertical]);

  return (
    <div className={`timeline-wrapper${isVertical ? ' _vertical' : ''}`} style={background}>
      { fsEnable && <Header title="Ключевые события" width="100%" /> }
      <div
        className="timeline-container"
        onScroll={scrollHandler}
        style={containerStyle}
        ref={horizontalContainerRef}
      >
        {/*<div className="vertical-line" />*/}
        {
              containerWidth
              && containerHeight
              && (
              <TimeAxis
                events={events}
                periods={periods}
                width={containerWidth}
                zoom={zoom}
                levelLimit={levelLimit}
                theme={Themes.current}
                height={containerHeight}
                elementsOverAxis={elementsOverAxis}
                zoomSliderStopped={zoomSliderStopped}
                visibilityChecking={visibilityChecking}
                onItemClick={itemClickHandler}
                activeItem={activeItem}
                isDeprecatedBrowser={isDeprecatedBrowser}
              />
              )
            }
      </div>
      <Footer
        enableToSwitchFS={enableToSwitchFS}
        onOpenPress={openFullScreen}
        onClosePress={closeFullScreen}
        fullScreenMode={fsEnable}
        zoom={zoom}
        onSliderStop={onZoomSliderStop}
        onZoomChange={onZoomChange}
      />
      { activeItem
      && (
      <Message
        item={activeItem.item}
        onClose={messageClose}
        indent={fsEnable ? 49 : 0}
        pinned={isVertical}
      />
      ) }
    </div>
  );
}
