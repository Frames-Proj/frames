import * as React from 'react';

export interface VideoProps {
    title: string,
    user: string,
    length: number,
    thumbnail: string,
    key: number
}

export class Video extends React.Component<VideoProps, {}> {

    constructor(props) {
        super(props);
    }

    render() {

        return (
            <div style={{
                display: 'inline-block',
                marginRight: '30px',
                marginBottom: '30px'
            }}>
                <a href='#' style={{
                    cursor: 'pointer'
                }}>
                    <div style={{
                        height: '100px',
                        width: '150px',
                        background: 'black'
                    }}>
                    </div>
                    <span>
                        { this.props.title }
                    </span>
                </a>
                <div style={{
                    fontSize: '12px',
                    color: 'gray'
                }}>
                    { this.props.user }
                </div>
            </div>
        );

    }

};
