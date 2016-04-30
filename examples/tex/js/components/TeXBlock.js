/**
 * Copyright (c) 2013-present, Facebook, Inc. All rights reserved.
 *
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

import katex from 'katex';
import React from 'react';
import {Editor, EditorState, ContentState, Entity} from 'draft-js';

class KatexOutput extends React.Component {
  constructor(props) {
    super(props);
    this._timer = null;
  }

  _update() {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    this._timer = setTimeout(() => {
      katex.render(
        this.props.content,
        this.refs.container,
        {displayMode: true}
      );
    }, 0);
  }

  componentDidMount() {
    this._update();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.content !== this.props.content) {
      this._update();
    }
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
    this._timer = null;
  }

  render() {
    return <div ref="container" onClick={this.props.onClick} />;
  }
}

export default class TeXBlock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      visible: true,
      texValue: this._getValue(),
      editorState: EditorState.createWithContent(
        ContentState.createFromText(this._getValue())
      )
    };

    this._onClick = () => {
      // e.stopPropagation();
      if (this.state.visible) {
        if (this.state.editMode) {
          return;
        } else {
          this.setState({
            editMode: true,
            texValue: this._getValue()
          }, () => {
            this._startEdit();
            setTimeout(() => this.refs.editor2.focus(), 0);
          });
        }
      } else {
        this.setState({
          editMode: false,
          visible: true,
          texValue: this._getValue()
        });
      }
    };

    this._onEditorChange = editorState => {
      var value = editorState.getCurrentContent().getPlainText();
      var invalid = false;
      try {
        katex.__parse(value);
      } catch (e) {
        invalid = true;
      } finally {
        this.setState({
          invalidTeX: invalid,
          texValue: value,
          editorState: editorState
        });
      }
    };

    this._save = (e) => {
      e.stopPropagation();
      var entityKey = this.props.block.getEntityAt(0);
      Entity.mergeData(entityKey, {content: this.state.texValue});
      this.setState({
        invalidTeX: false,
        visible: false,
        editMode: false
      }, this._finishEdit);
    };

    this._remove = () => {
      this.props.blockProps.onRemove(this.props.block.getKey());
    };
    this._startEdit = () => {
      this.props.blockProps.onStartEdit(this.props.block.getKey());
    };
    this._finishEdit = () => {
      this.props.blockProps.onFinishEdit(this.props.block.getKey());
    };

    this._onBlur = () => {
      if (this.state.editMode) {
        var entityKey = this.props.block.getEntityAt(0);
        Entity.mergeData(entityKey, {content: this.state.texValue});
        this.setState({
          invalidTeX: false,
          editMode: false
        }, this._finishEdit);
      }
    };
  }

  _getValue() {
    return Entity
      .get(this.props.block.getEntityAt(0))
      .getData()['content'];
  }

  render() {
    var texContent = null;
    var texContentClassName = '';
    var texPanelClassName = 'TeXEditor-panel TeXEditor-activeTeX';
    var buttonClass = 'TeXEditor-saveButton';

    if (this.state.editMode) {
      texContentClassName = 'TeXEditor-activeTeX';
      texPanelClassName = 'TeXEditor-panel';
      if (this.state.invalidTeX) {
        texContent = '';
        buttonClass += ' TeXEditor-invalidButton';
      } else {
        texContent = this.state.texValue;
      }
    } else {
      texContent = this._getValue();
    }

    var editPanel =
        <div className={texPanelClassName}
          style={
            this.state.visible ?
            {} :
            {display: 'none'}
          }>
          <Editor
              className="TeXEditor-texValue"
              editorState={this.state.editorState}
              onChange={this._onEditorChange}
              placeholder="Start a document..."
              readOnly={!this.state.editMode}
              ref="editor2"
            />
          <div className="TeXEditor-buttons">
            <button
              className={buttonClass}
              disabled={this.state.invalidTeX}
              onClick={this._save}>
              {this.state.invalidTeX ? 'Invalid TeX' : 'Done'}
            </button>
            <button className="TeXEditor-removeButton" onClick={this._remove}>
              Remove
            </button>
          </div>
        </div>;

    return (
      <div onClick={this._onClick} onBlur={this._onBlur}
          className="TeXEditor-tex">
        <div className={texContentClassName}>
          <KatexOutput content={texContent} />
        </div>
        {editPanel}
      </div>
    );
  }
}
