import React, { useMemo } from 'react';
import {
  GestureResponderEvent, TouchableOpacity, View,
} from 'react-native';
import style from './style';
import OpenButton from './open-full-screen';
import CloseButton from './close-full-screen';
import ZoomSlider from './zoom-slider';

type Props = {
  fullScreenMode: boolean,
  zoom: number,
  enableToSwitchFS: boolean,
  onOpenPress: (event: GestureResponderEvent) => void,
  onClosePress: (event: GestureResponderEvent) => void,
  onZoomChange: Function,
  onSliderStop: Function,
};

// eslint-disable-next-line react/function-component-definition
export default function Footer(props: Props): JSX.Element {
  const {
    fullScreenMode, zoom, onOpenPress, onClosePress, onZoomChange, onSliderStop, enableToSwitchFS,
  } = props;

  const button = useMemo(() => {
    if (!enableToSwitchFS) return null;

    return fullScreenMode
      ? (
        <TouchableOpacity onPress={onClosePress}>
          <View
            style={style.button}
          >
            <CloseButton />
          </View>
        </TouchableOpacity>
      )
      : (
        <TouchableOpacity onPress={onOpenPress}>
          <View
            style={style.button}
          >
            <OpenButton />
          </View>
        </TouchableOpacity>
      );
  }, [enableToSwitchFS, fullScreenMode, onOpenPress, onClosePress]);

  return (
    <View style={[style.footer]}>
      <ZoomSlider
        value={zoom}
        onChange={onZoomChange}
        onSliderStop={onSliderStop}
      />
      { button }
    </View>

  );
}
