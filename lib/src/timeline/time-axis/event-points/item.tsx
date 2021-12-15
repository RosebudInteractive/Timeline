import React from 'react';
import {
  Animated, LayoutChangeEvent, NativeSyntheticEvent, Text,
  TextLayoutEventData, TextStyle, TouchableHighlight, ViewStyle,
} from 'react-native';
import SerifsContext, { ISerif } from '../serifs/context';
import styles from './styles';
import { calcScaleY, hexToRgb, VERTICAL_STEP } from '../../../helpers/tools';
// import Mask from '../gradient-mask';
import { Event } from '../../../types/event';

type Props = {
  item: Event.VisualItem,
  onMount: Function,
  onClick: Function,
  x: number,
  y: number,
  visible: boolean,
  level: number,
  isActive: boolean,
  index: number,
  axisY: number,
  zIndex: number,
  onLastPoint?: Function,
};

type State = {
  needMask: boolean,
  flagHeight: number,
  opacity: any,
  top: any,
  scale: any,
  indent: any,
  footIndent: any,
};

const MAX_WIDTH = 141;

export default class EventPoint extends React.PureComponent<Props, State> {
  // eslint-disable-next-line react/sort-comp
  private opacityAnim: Animated.Value;

  private verticalAnim: Animated.Value;

  private readonly setViewRef: Function;

  private viewRef: HTMLDivElement | null;

  constructor(props: Props) {
    super(props);

    this.opacityAnim = new Animated.Value(1);
    this.verticalAnim = new Animated.Value(1);
    this.viewRef = null;

    this.setViewRef = (element: HTMLDivElement) => {
      const { isDeprecatedBrowser }: ISerif = this.context;

      if (!isDeprecatedBrowser || !element) return;

      setTimeout(() => {
        const width = element.clientWidth;
        const { onMount, x, item } = this.props;

        if (onMount && width) {
          this.viewRef = element;
          item.left = x;
          item.width = width;
          onMount(item.id);
        }
      }, 0);
    };
    this.state = {
      needMask: false,
      flagHeight: 0,
      opacity: this.opacityAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1],
      }),
      top: this.verticalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, props.y],
      }),
      scale: this.verticalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      indent: this.verticalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0],
      }),
      footIndent: this.verticalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0],
      }),
    };
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
    const {
      visible, y, level, axisY,
    } = this.props;
    const {
      flagHeight, opacity, scale, top,
    } = this.state;

    if (prevProps.visible !== visible) {
      this.opacityAnim = new Animated.Value(0);

      const oldValue = prevProps.visible ? 1 : 0;
      const newValue = visible ? 1 : 0;

      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        opacity: this.opacityAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [oldValue, newValue],
        }),
      });
    }

    if (opacity !== prevState.opacity) {
      Animated.timing(this.opacityAnim, {
        toValue: 1,
        duration: 580,
        useNativeDriver: true,
      }).start();
    }

    if (prevProps.y !== y) {
      const prevScale = calcScaleY(prevProps.level, flagHeight);
      const newScale = calcScaleY(level, flagHeight);
      const oldIndent = (prevProps.level * VERTICAL_STEP) / 2;
      const newIndent = (level * VERTICAL_STEP) / 2;
      const oldFootIndent = axisY - prevProps.y - 50;
      const newFootIndent = axisY - y - 50;

      this.verticalAnim = new Animated.Value(0);
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        top: this.verticalAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [prevProps.y, y],
        }),
        scale: this.verticalAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [prevScale, newScale],
        }),
        indent: this.verticalAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [oldIndent, newIndent],
        }),
        footIndent: this.verticalAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [oldFootIndent, newFootIndent],
        }),
      });
    }

    if ((top !== prevState.top) || (scale !== prevState.scale)) {
      Animated.timing(this.verticalAnim, {
        toValue: 1,
        duration: 670,
        useNativeDriver: true,
      }).start();
    }
  }

  // eslint-disable-next-line react/sort-comp
  onTextLayout(event: NativeSyntheticEvent<TextLayoutEventData>) {
    if (event.nativeEvent.lines.length > 1) {
      this.setState({
        needMask: true,
      });
    }
  }

  onTextContainerLayout(event: LayoutChangeEvent) {
    const data = event.nativeEvent.layout;
    const { width, height } = data;
    const { level } = this.props;

    const newScale = calcScaleY(level, height);
    const newIndent = (level * VERTICAL_STEP) / 2;

    this.setState({
      flagHeight: height,
      scale: this.verticalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, newScale],
      }),
      indent: this.verticalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, newIndent],
      }),
    });

    if (width >= MAX_WIDTH - 16) {
      this.setState({
        needMask: true,
      });
    }
  }

  onViewLayout(event: LayoutChangeEvent) {
    const data = event.nativeEvent.layout;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { width } = data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onMount, x, item } = this.props;

    if (onMount && width) {
      item.left = x;
      item.width = width;
      onMount(item.id);
    }
  }

  onClick() {
    const { onClick, item } = this.props;

    if (onClick) { onClick(item); }
  }

  render() {
    const { theme, isDeprecatedBrowser }: ISerif = this.context;

    const {
      isActive, x, item, zIndex, index,
    } = this.props;
    const {
      // @ts-ignore
      top, scale, indent, opacity, flagHeight, needMask, footIndent,
    } = this.state;
    // const left = x * zoom;
    const left = x;

    const wrapperStyle = {
      left,
      zIndex,
      opacity,
      maxWidth: MAX_WIDTH,
      transform: [{ translateY: top }],
    };

    const color = theme ? theme.getColor(index) : item.color;
    const enableAlpha = theme ? theme.enableAlpha : true;

    item.color = color;

    let backgroundColor = color;

    if (enableAlpha) {
      const { r, g, b } = hexToRgb(color);
      const alpha = isActive ? 1 : 0.5;

      backgroundColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const eventStyle: ViewStyle = {
      backgroundColor,
    };
    const flagpoleStyle = {
      backgroundColor,
      opacity: isActive ? 1 : 0.57,
      height: VERTICAL_STEP - flagHeight,
      top: flagHeight,
      transform: [{ translateY: indent }, { scaleY: scale }],
    };
    const dateStyle = {
      opacity: isActive ? 1 : 0.57,
    };

    const footStyle = {
      backgroundColor,
      opacity: isActive ? 1 : 0.57,
      transform: [{ translateY: footIndent }],
    };

    const titleStyle: TextStyle = {};

    if (theme) {
      if (theme.font?.family) {
        titleStyle.fontFamily = theme.font.family;
      }

      if (theme.font?.weight) {
        titleStyle.fontWeight = theme.font.weight;
      }

      if (theme.font?.size) {
        const lineHeight = theme.font.size + 8;
        eventStyle.height = lineHeight;
        titleStyle.lineHeight = lineHeight;
        titleStyle.fontSize = theme.font.size;
      }

      if (theme.font?.color) {
        titleStyle.color = theme.font.color;
      }
    }

    if (isDeprecatedBrowser && this.viewRef) {
      const width = this.viewRef.clientWidth;
      if (item.width !== width) item.width = width;
    }

    /* eslint-disable react/jsx-no-bind */
    return (
      <Animated.View
        style={[styles.wrapper, wrapperStyle]}
        onLayout={this.onViewLayout.bind(this)}
        // @ts-ignore
        ref={this.setViewRef}
      >
        <TouchableHighlight onPress={this.onClick.bind(this)} underlayColor="transparent">
          <Animated.View>
            <Animated.View style={[styles.event, eventStyle]}>
              <Text
                numberOfLines={1}
                style={[styles.title, titleStyle]}
                onLayout={this.onTextContainerLayout.bind(this)}
                onTextLayout={this.onTextLayout.bind(this)}
              >
                {item.shortName || item.name}
              </Text>
              {/* { needMask && <Mask color={backgroundColor} isActive={isActive} /> } */}
            </Animated.View>
            <Text numberOfLines={1} style={[styles.title, styles.date, dateStyle]}>
              {item.displayDate}
            </Text>
            <Animated.View style={[styles.flagpole, flagpoleStyle]} />
            <Animated.View style={[styles.foot, footStyle]} />
          </Animated.View>
        </TouchableHighlight>
      </Animated.View>
    );
    /* eslint-enable react/jsx-no-bind */
  }
}

EventPoint.contextType = SerifsContext;
