import * as React from 'react';

export interface NotificationProps {
    type: string;
    message: string;
    style?: any;
    show?: boolean;
}

export class Notification extends React.Component<NotificationProps, {}> {

    public constructor(props) {
        super(props);
    }

    render() {

        var boxColor: string;
        if (this.props.type == "warning")
           boxColor = "#eea236";
        else if (this.props.type == "error")
           boxColor = "rgb(245, 50, 64)";
        else if (this.props.type == "success")
           boxColor = "green";

        var borderStyle = {
            color: 'gray',
            marginTop: '10px',
            border: 'solid 1px' + ' ' + boxColor,
            borderRadius: '5px'
        };

        var titleStyle = {
            color: 'white',
            backgroundColor: boxColor,
            padding: '5px 10px',
            'text-transform': 'uppercase'
        };

        if (this.props.style) {
            this.props.style["display"] = this.props.show ? "block" : "none";
        }

        return (
            <div style={this.props.style}>
                <hr/>
                <div style={borderStyle}>
                    <div style={titleStyle}>
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" style={{
                            marginRight: '5px',
                            textTransform: 'uppercase'
                        }}></i> {this.props.type}
                    </div>
                    <div style={{
                        padding: '10px'
                    }}>
                        {this.props.message} 
                    </div>
                </div>
            </div>
        );

    }
};
