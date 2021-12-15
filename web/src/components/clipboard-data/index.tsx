import React, {useMemo, useState} from "react";
import './clipboard-data.sass';

type Props = {
    onApplyClick: Function,
}

export default function ClipboardData(props: Props): JSX.Element | null{
    const [value, setValue] = useState<string>('')

    const disabled: boolean = useMemo(() => {
        if (!value) return true

        try {
            const data: any = JSON.parse(value);
            return !data.Events && !data.Periods
        } catch (e) {
            return true
        }
    }, [value])

    function inputChangeHandler(e: any): void {
        setValue(e.currentTarget.value)
    }

    const onClick = () => {
        props.onApplyClick(JSON.parse(value))
    }

    return <div className='clipboard-data__container _with-custom-scroll'>
        <textarea className='clipboard-data__input' onChange={inputChangeHandler}/>
        <button className='clipboard-data__apply-button' disabled={disabled} onClick={onClick}>Применить</button>
    </div>
}
