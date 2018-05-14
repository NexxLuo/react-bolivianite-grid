import * as React from 'react';
import * as PapaParse from 'papaparse';
import Grid, { ClipboardController } from 'react-bolivianite-grid';
import EditableGrid from './editable-grid';
import Theme from './style';

export default class extends EditableGrid {
    protected _cpb: ClipboardController;

    constructor(_p: any, _c: any) {
        super(_p, _c);

        this._cpb = new ClipboardController({
            // Rendering header on copy event
            renderHeader: ({ header, type }) => {
                return this.getHeaderCaption(header, type);
            },
            // Rendering cell on copy event
            renderCell: ({ cell, source, headers }) => {
                let rowHeader = headers.rows[cell.row];
                let colHeader = headers.columns[cell.column];
                return this.getValue(rowHeader, colHeader, source);
            },
            // Parsing clipboard on paste event
            clipboardParser: (transfer) => {
                let text = transfer.getData('Text') || '';
                let { data } = PapaParse.parse(text, { delimiter: '\t' });
                return data || [];
            },
            // Parsing cell on paste event
            cellParser: ({ value }) => {
                return value;
            },
            onInvalidSelection: () => {
                alert(`Impossible to copy current selection.`);
            },
            onCopy: ({ table, focus }) => {
                let data = PapaParse.unparse(table, { delimiter: '\t' });

                let ta = document.createElement('textarea');
                ta.style.position = 'fixed';
                ta.style.top = '200vh';
                ta.value = data;

                document.body.appendChild(ta);
                ta.select();

                let success = document.execCommand('Copy');
                document.body.removeChild(ta);
                focus();

                if (!success) {
                    alert('Failed to copy current selection.');
                }
            },
            onPaste: ({ changes }) => {
                let { data, headers } = this.currentState;
                data = { ...data };

                changes.forEach(({ column, row, value }) => {
                    if (!headers.rows[row] || !headers.columns[column]) {
                        return;
                    }

                    data[this.getDataKey(row, column)] = value;
                });

                this.pushHistory({ data, headers });
            }
        });
    }

    renderGrid() {
        const { data, headers } = this.currentState;
        return (
            <Grid
                headers={headers}
                overscanRows={3}
                source={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
                onCopy={this._cpb.onCopy}
                onPaste={this._cpb.onPaste}
            />
        );
    }
}

