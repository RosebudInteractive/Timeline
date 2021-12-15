import React, {useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import appStyles from '../../styles';

type Props = {
  value: number,
  title?: string,
  onChange: Function,
}

export const MAX_LEVEL_LIMIT = 7;

const defaultTitle : string = 'Максимальное количество уровней'

export default function LevelLimit(props: Props) {
  const { value, title } = props;

  const incLimit = () => {
    if (value >= MAX_LEVEL_LIMIT) return;

    if (props.onChange) { props.onChange(value + 1); }
  };

  const decLimit = () => {
    if (value < 0) return;

    if (props.onChange) { props.onChange(value - 1); }
  };

  const myTitle = useMemo(() => {
    return title ? title : defaultTitle;
  }, [title])

  return (
    // @ts-ignore
    <View style={[appStyles.controlContainer, {flex: '0 0 auto'}]}>
      <Text style={[appStyles.buttonsTitle, { marginRight: 20 }]}>
        {`${myTitle}: ${value}`}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
        <TouchableOpacity onPress={incLimit}>
          <View
            style={[appStyles.button, (value >= MAX_LEVEL_LIMIT) && appStyles.buttonDisabled]}
          >
            <Text style={appStyles.buttonText}>
              +
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={decLimit}>
          <View style={[appStyles.button, (value <= 0) && appStyles.buttonDisabled]}>
            <Text style={appStyles.buttonText}>
              -
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
