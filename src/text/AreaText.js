/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2016, Juerg Lehni & Jonathan Puckey
 * http://scratchdisk.com/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name AreaText
 *
 * @class An AreaText item represents a piece of typography in your Paper.js
 * project which starts from a certain point and extends by the amount of
 * characters contained in it.
 *
 * @extends TextItem
 */

var AreaText = TextItem.extend(/** @lends AreaText **/ {
    _class: 'AreaText',
    _htmlElement: 'input',
    _htmlId: 'area-text',
    _outsideClickId: null,
    _editModeListeners: null,
    _editModeChangeListeners: null,
    _textTransform: 'initial',
    _lastCharCode: '',

    _oldViewMatrix: null,
    _oldParams: null,

    _serializeFields: {
        textTransform: null,
        justification: null,
        boundsGenerator: null,
        lines: [],
        width: null,
        height: null,
    },

    /**
     * Creates an area text item
     *
     * @name AreaText#initialize
     * @param {Rectangle} point the position where the text will start
     * @return {AreaText} the newly created point text
     *
     */
    /**
     * Creates an area text item from the properties described by an object
     * literal.
     *
     * @name AreaText#initialize
     * @param {Object} object an object containing properties describing the
     *     path's attributes
     * @return {AreaText} the newly created point text
     */
    initialize: function AreaText () {
        this._anchor = [0,0];
        this._needsWrap = false;
        this._editMode = false;
        this._htmlElement = 'textarea';
        this._rectangle = new Rectangle(0, 0, 1, 1);
        var lines = arguments[0] && arguments[0].lines ?  arguments[0].lines : [];

        if (arguments[0] && arguments[0].boundsGenerator) {
            this._boundsGenerator = arguments[0].boundsGenerator;
            delete arguments[0].boundsGenerator;
        } else {
            this._boundsGenerator = 'auto';
        }

        if (arguments[0] && arguments[0].lines) {
            delete arguments[0].lines;
        }

        TextItem.apply(this, arguments);
        this._htmlId += UID.get(this._htmlId);

        if (arguments.length === 1 && arguments[0] instanceof Rectangle) {
            this.setRectangle(arguments[0]);
        }

        if (arguments[0] && arguments[0].height) {
            this.setHeight(arguments[0].height);
        }

        if (arguments[0] && arguments[0].width) {
            this.setWidth(arguments[0].width);
        }

        if (arguments[0] && arguments[0].matrix) {
            this._rectangle.x = arguments[0].matrix[4];
            this._rectangle.y = arguments[0].matrix[5];
        }

        this._lines = lines;
    },


    _addListener: function (listener, name) {
        if (typeof listener !== 'function') {
            throw new Error('Argument is not a function');
        }
        var id = UID.get();
        var self = this;
        if (!this[name]) {
            this[name] = [];
        }
        this[name].push({ id: id, listener: listener });
        return function () {
            self[name] = self[name].filter(function (listener) {
                return listener.id !== id;
            });
        };
    },

    addEditModeListener: function (listener) {
      return this._addListener(listener, '_editModeListeners');
    },

    addModeChangeListener: function (listener) {
        return this._addListener(listener, '_editModeChangeListeners');
    },

    getLines: function () {
        return this._lines;
    },


    setLines: function (lines) {
        this._lines = lines;
    },

    /**
     * Determines if the AreaText is in edit mode
     * ( In edit mode input for the current is being active )
     *
     * @bean
     * @type {Boolean}
     */
    getEditMode: function () {
        return this._editMode;
    },

    /**
     * Change edit mode edit/normal
     * If normal -> then canvas representation
     *
     * Else -> Input/TextArea HTML
     */
    setEditMode: function (bool) {
        this._changeMode(bool);
    },

    /**
     * Determines if the AreaText is in edit mode
     * ( In edit mode input for the current is being active )
     *
     * @bean
     * @type {TextTransform}
     */
    getTextTransform: function () {
        return this._textTransform;
    },

    setTextTransform: function () {
        this._textTransform = arguments[0];
        this.setContent(this._content);
        this._redraw();
    },

    /**
     * ID of the HTML element
     * @return {string}
     */
    getHtmlId: function () {
        return this._htmlId;
    },


    /**
     * The AreaText's rectangle for wrapping
     * @bean
     * @type {Rectangle}
     */
    getRectangle: function () {
        return this._rectangle;
    },

    /**
     * Get bounds generator which defines the type of the AreaText behavior
     * @return {BoundsGenerator}
     */
    getBoundsGenerator: function () {
        return this._boundsGenerator;
    },

    setBoundsGenerator: function (generator) {
        if (AreaText.boundsGenerators.indexOf(generator) === -1) {
            throw new Error('Generator ' + generator + ' is not included in ' + AreaText.boundsGenerators.toString());
        }

        this._boundsGenerator = generator;
        if (generator === 'auto-width') {
            this._htmlElement = AreaText._allowedElements.input;
            this.content = this.content.replace(/\s/g, '');
        } else {
            this._htmlElement = AreaText._allowedElements.textArea;
        }


        this._changed(/*#=*/Change.APPEARANCE);
        this._wrap(this._getContext());
    },

    /**
     * Get current content of AreaText
     *
     * @bean
     * @type {string|string|*}
     */
    getContent: function () {
      return this._content;
    },

    /**
     * Setter for content.
     */
    setContent: function (content) {
        if (this._textTransform === 'uppercase') {
            content = content.toUpperCase();
        } else if (this._textTransform === 'lowercase') {
            content = content.toLowerCase();
        } else if (this._textTransform === 'capitalize') {
            content = Base.capitalize(content);
        }
        this._content = '' + content;
        this._needsWrap = true;
        this._changed(/*#=*/Change.CONTENT);
    },

    /**
     * Return HTML element name
     * @return {string}
     */
    getEditElement: function () {
      return this._htmlElement;
    },

    /**
     * Justification
     *
     * @bean
     * @type {String}
     */
    getJustification: function () {
        return this._style.justification;
    },

    setJustification: function () {
        this._style.justification = arguments[0];
        this._updateAnchor();
    },

    getSpacing: function () {
        return this._style.letterSpacing;
    },

    setSpacing: function (letterSpacing) {
        this._style.letterSpacing = letterSpacing;
        this._redraw();
    },

    getFontWeight: function () {
        return this._style.fontWeight;
    },

    setFontWeight: function () {
        this._style.fontWeight = arguments[0];
        this._redraw();
    },

    _redraw: function() {
        this._needsWrap = true;
        if (this._oldParams) {
            this.draw(this._getContext(), this._oldParams, this._oldViewMatrix);
        }
    },

    getHeight: function () {
        return this._rectangle.height;
    },

    setHeight: function () {
        this._rectangle.height = arguments[0];
        this._updateAnchor();
        this._changed(/*#=*/Change.GEOMETRY);
    },

    getWidth: function () {
        return this._rectangle.width;
    },

    setWidth: function () {
        this._rectangle.width = arguments[0];
        this._updateAnchor();
        this._changed(/*#=*/Change.GEOMETRY);
    },

    /**
     * Setter for rectangle. Determines the position of the element
     */
    setRectangle: function () {
        var rectangle = Rectangle.read(arguments);
        this._rectangle = rectangle;

        this.translate(rectangle.topLeft.subtract(this._matrix.getTranslation()));
        this._updateAnchor();
        if (arguments.length > 1 && typeof arguments[1] === 'boolean' && arguments[1]) {
            this._needsWrap = arguments[1];
        } else {
            this._needsWrap = true;
        }
        this._changed(/*#=*/Change.GEOMETRY);
    },

    _changeMode: function (mode) {
        mode = !!mode;
        for (var i = 0; Array.isArray(this._editModeChangeListeners) && i < this._editModeChangeListeners.length; i++) {
            this._editModeChangeListeners[i].listener(mode);
        }

        this._editMode = mode || !this.editMode;
        if (this._editMode) {
            this._setEditMode();
        } else {
            this._setNormalMode();
        }
    },

    _containerStyles: function (container) {
        var canvasBoundingBox = this.view.context.canvas.getBoundingClientRect();
        container.style.position = 'absolute';
        container.style.width = this.rectangle.width * this.viewMatrix.scaling.x + 'px';
        container.style.height = this.leading * this.viewMatrix.scaling.y + 'px';
        container.style.left = canvasBoundingBox.left +  this.viewMatrix._tx + 'px';
        container.style.top = canvasBoundingBox.top + this.viewMatrix._ty + 'px';
        container.style.maxHeight = this.view.getViewSize().height + 'px';
    },

    _containerStylesAutoHeight: function (container) {
        container.style.height = '100%';
        this._containerStyles(container);
    },

    _containerStylesAutoWidth: function (container) {
        this._containerStyles(container);
        container.style.width = 'auto';
        container.style.whiteSpace = 'nowrap';
    },

    _containerStylesAuto: function (container) {
        this._containerStyles(container);
        container.style.height = '100%';
        container.style.width = 'auto';
        container.style.whiteSpace = 'nowrap';
    },

    _elementStyles: function (element) {
        var scaling = this.scaling.y * this.viewMatrix.scaling.y;
        element.style.color = this._style.fillColor.toCSS(true);
        element.style.textTransform = this._textTransform;
        element.style.opacity = this.opacity;
        element.style.fontFamily = this._style.fontFamily;
        element.style.fontSize = this._style.fontSize * scaling + 'px';
        this._applyLetterSpacing(element, this.scaling.x * this.viewMatrix.scaling.x, this._style.fontSize);

        element.style.fontWeight = this.fontWeight;
        element.style.lineHeight = '' + (this._style.leading ) / this.style.fontSize;
        element.style.transformOrigin = 'top left';
        element.style.transform = 'rotate(' + this.rotation + 'deg)';
        element.style.width = '100%';
        element.style.resize = 'none';
        element.style.border = 'none';
        element.style.margin = '0';
        element.style.marginTop = this._getOffsetTop() + 'px';
        element.style.padding = '0';
        element.style.outline = '0';
        element.style.boxSizing = 'border-box';
        element.style.backgroundColor = 'transparent';
        element.style.overflow = 'hidden';
        element.style.wordWrap = 'break-word';
        element.style.height = '100%';
    },

    _elementStylesAuto: function (element) {
        this._elementStylesAutoHeight(element);
        element.setAttribute('autocomplete', 'off');
        element.style.position = 'absolute';
    },

    _elementStylesAutoHeight: function (element) {
        this._elementStyles(element);
        element.style.height = this.rectangle.height * this.viewMatrix.scaling.y + 'px';
    },

    _elementStylesAutoWidth: function (element) {
        this._elementStyles(element);
        element.setAttribute('autocomplete', 'off');
        element.style.position = 'absolute';
    },

    _getOffsetTop: function () {
        return this._style.fontSize * this.scaling.y * this.viewMatrix.scaling.y * 0.066;
    },

    _divStyles: function (div) {
        var scaling = this.scaling.y * this.viewMatrix.scaling.y;
        div.style.fontFamily = this._style.fontFamily;
        div.style.fontSize = this._style.fontSize * scaling + 'px';
        div.style.fontWeight = this.fontWeight;
        this._applyLetterSpacing(div, this.scaling.x * this.viewMatrix.scaling.x, this._style.fontSize);
        div.style.textTransform = this._textTransform;
        div.style.lineHeight = '' + this._style.leading / this.style.fontSize;
        div.style.marginTop = -this._getOffsetTop() + 'px';
        div.style.visibility = 'hidden';
        div.style.width = this.rectangle.width * this.viewMatrix.scaling.x + 'px';
        div.style.wordWrap = 'break-word';
    },

    _divStylesAutoHeight: function (div) {
        this._divStyles(div);
        div.style.width = this.rectangle.width * this.viewMatrix.scaling.x + 'px';
    },

    _divStylesAutoWidth: function (div) {
        this._divStyles(div);
        div.style.wordWrap = 'initial';
        div.style.display = 'inline-block';
        div.style.width = 'fit-content';
    },

    _divStylesAuto: function (div) {
        this._divStylesAutoWidth(div);
    },

    _setElementStyles: function (element) {
        var strategy = Base.camelize(Base.capitalize(this._boundsGenerator));
        this['_elementStyles' + strategy](element);
    },

    _setContainerStyles: function (container) {
        var strategy = Base.camelize(Base.capitalize(this._boundsGenerator));
        this['_containerStyles' + strategy](container);
    },

    _setDivStyles: function (div) {
        var strategy = Base.camelize(Base.capitalize(this._boundsGenerator));
        this['_divStyles' + strategy](div);
    },

    _getContext: function () {
        var ctx = this.view.context;
        ctx.font = this.style.getFontStyle();
        ctx.textAlign = this.style.getJustification();
        return ctx;
    },

    _setEditAutoHeight: function (self, element, div) {
        function autoHeight(event) {
            var calcLines;
            if (self._boundsGenerator === 'auto-height') {
                calcLines = self._calculateLines(self._getContext(), element.value);
                element.value = calcLines.join('\n');
            } else {
                calcLines = element.value.split('\n');
            }
            div.innerHTML = calcLines
                .join("<br>")
                .replace(/\s/g, AreaText._spaceSeparators.nonBreaking);
            if (!div.innerHTML) {
                div.innerHTML = AreaText._spaceSeparators.thinSpace;
            }
            var heightSetter;
            if (Base.endsWith(div.innerHTML, '<br>')) {
                heightSetter = div.getBoundingClientRect().height + (self.leading * self.viewMatrix.scaling.y);
            } else {
                heightSetter = div.getBoundingClientRect().height;
            }
            element.style.height = (heightSetter + self._getOffsetTop() * 2).toFixed() + 'px';
            self.setHeight(heightSetter / self.viewMatrix.scaling.y);
        }


        // initial setup
        autoHeight();
        // input watch
        element.addEventListener('input', autoHeight);
    },

    _setEditAutoWidth: function (self, element, div, changeDiv) {
        if (typeof changeDiv === "undefined") {
            changeDiv = true;
        }
        function autoWidth() {
            if (changeDiv) {
                div.innerHTML = element.value.replace(/\s/g, AreaText._spaceSeparators.nonBreaking);
            }
            var width = div.scrollWidth ? div.scrollWidth : 1;
            self.setWidth(width / self.viewMatrix.scaling.x);
        }

        // initial setup
        autoWidth();
        // input watch
        element.addEventListener('input', autoWidth);
    },


    _setEditAuto: function (self, element, div) {
        self._setEditAutoHeight(self, element, div);
        self._setEditAutoWidth(self, element, div, false);
    },

    _setEditElementDOM: function (container) {
        var childElement = document.createElement('div');
        container.style.overflow = 'hidden';
        container.style.position = 'fixed';
        container.style.top = 0 + '';
        container.style.left = 0 + '';
        container.style.width = 0 + '';
        container.style.height = 0 + '';

        var wrapper = document.createElement('div');
        wrapper.style.pointerEvents = 'auto';
        wrapper.style.position = 'fixed';

        wrapper.appendChild(childElement);
        container.appendChild(wrapper);

        document.body.appendChild(container);
        container.classList.add('area-text');

        var element = document.createElement(this._htmlElement);
        element.id = this._htmlId;
        element.classList.add('area-text-input');

        childElement.appendChild(element);
        this._setContainerStyles(childElement);
        this._setElementStyles(element);

        // create div as well
        var div = document.createElement('div');
        childElement.appendChild(div);
        this._setDivStyles(div);

        element.value = '' + this._content;
        var self = this;
        element.addEventListener('keydown', function (event) {
            if (Base.endsWith(event.target.value, ". ") && event.code === 'Space' && self._lastCharCode === 'Space') {
                event.target.value = event.target.value.replace(new RegExp(". " + "$"), "  ");
            }
            self._lastCharCode = event.code;
        });

        if (this._boundsGenerator === 'auto-height') {
           this._setEditAutoHeight(this, element, div);
        } else if (this._boundsGenerator === 'auto-width') {
            this._setEditAutoWidth(this, element, div);
        } else {
            this._setEditAuto(this, element, div);
        }
        element.addEventListener('input', function (e) {
            for (var i = 0; Array.isArray(self._editModeListeners) && i < self._editModeListeners.length; i++) {
                self._editModeListeners[i].listener(e);
            }
        });
    },

    _setEditMode: function () {
        var element =  document.getElementById(AreaText._htmlParentId);
        if (!element) {
            element = document.createElement('div');
            element.id = AreaText._htmlParentId;
        }
        this._setEditElementDOM(element);
        this.setContent('');
    },

    _setNormalMode: function () {
        var element = document.getElementById(AreaText._htmlParentId);
        this.setContent( element.querySelector('#' + this._htmlId).value );
        element.remove();
    },

    _onDoubleClick: function () {
        this.on('doubleclick', this._changeMode);
    },

    _calculateLines: function (ctx, content) {
        var self = this;
        function calcLines(lines, i) {
            var newSubStr = '';
            while (ctx.measureText(lines[i]).width > self.rectangle.width && lines[i].length > 1) {
                newSubStr += lines[i].split('').pop();
                lines[i] = lines[i].slice(0, -1);
            }

            if (newSubStr !== '') {
                Base.insertAt(lines, i + 1, newSubStr.split('').reverse().join(''));
            }
        }

        var contentLines = content.split('\n');
        var lines = [];
        for (var i = 0; i < contentLines.length || i < lines.length; ++i) {
            var currentLine = i < contentLines.length ? contentLines[i] : lines[i];
            if (!currentLine || typeof currentLine !== 'string') {
                break;
            }

            if (ctx.measureText(currentLine).width > self.rectangle.width && currentLine.indexOf(' ') !== -1) {
                var str = Base.splitOnLast(currentLine, ' ');
                if (str[0] === currentLine.slice(-1)) {
                    str = Base.splitOnLast(currentLine.slice(-1), ' ');
                }
                lines.push(str[0], str[1]);
            } else {
                lines.push(contentLines[i]);
            }
            calcLines(lines, i);
        }

        if (contentLines[contentLines.length - 1] === '') {
            lines.push('');
        }

        contentLines = lines.filter(function (s) { return typeof s !== 'undefined'; });
        return contentLines;
    },

    _getLongest: function (ctx) {
        return this._lines.reduce(function (longest, current) {
            if (longest.length > current.length) {
                return longest;
            } else if (longest.length < current.length) {
                return current;
            } else {
                var l1 = ctx.measureText(longest).width;
                var l2 = ctx.measureText(current).width;
                return l1 >= l2 ? longest : current;
            }
        }, "");
    },

    _wrap: function (ctx) {
        this._lines = [];
        if (this._boundsGenerator === 'auto-width') {
            this._lines = [];
            this._lines.push(this.content.replace('\n', ''));
            var width = ctx.measureText(this._lines[0]).width;
            ctx.font = this.style.getFontStyle();
            ctx.textAlign = this.style.getJustification();
            this.setWidth(width);
            this.setHeight(this.getStyle().leading);
            return;
        } else if (this._boundsGenerator === 'auto-height') {
            if (this.width === 0) {
                this.setWidth(ctx.measureText(this.content).width);
            }
            this._lines = this._calculateLines(ctx, this.content);
        } else {
            this._lines = this.content.split('\n');
            if (!this.content) {
                this._lines = [" "];
            }
        }
        var longest = this._getLongest(ctx);
        this.setWidth(ctx.measureText(longest).width);
        var height = (this.getStyle().leading) * (this._lines.length );
        this.setHeight(height);
    },

    _updateAnchor: function () {
        var justification = this._style.getJustification(),
            rectangle = this.getRectangle(),
            anchor = new Point(0, this._style.fontSize);

        if (justification === 'center') {
            anchor = anchor.add([rectangle.width / 2, 0]);
        } else if (justification === 'right') {
            anchor = anchor.add([rectangle.width, 0]);
        }

        this._anchor = anchor;
    },

    _getAnchor: function () {
        return this._anchor;
    },

    _draw: function (ctx, params, viewMatrix) {
        if (!this._content) {
            return;
        }

        this._setStyles(ctx, params, viewMatrix);
        this._oldParams = params;
        this._oldViewMatrix = viewMatrix;

        var style = this._style,
            hasFill = style.hasFill(),
            hasStoke = style.hasStroke(),
            rectangle = this.rectangle,
            anchor = this._getAnchor(),
            leading = style.getLeading(),
            shadowColor = ctx.shadowColor;

        ctx.font = style.getFontStyle();
        ctx.textAlign = style.getJustification();

        if (this._needsWrap) {
            this._wrap(ctx);
            this._needsWrap = false;
        }

        var lines = this._lines;


        for (var i = 0, l = lines.length; i < l; i++) {
            if (i * leading > rectangle.height && (this._boundsGenerator === 'auto-height' || this._boundsGenerator === 'auto')) {
                return;
            }

            // See Path._draw() for explanation about ctx.shadowColor
            ctx.shadowColor = shadowColor;
            var line = lines[i];

            if (hasFill) {
                ctx.fillText(line, anchor.x, anchor.y);
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            }

            if (hasStoke) {
                ctx.strokeText(line, anchor.x, anchor.y);
            }

            ctx.translate(0, leading);
        }
    },

    _getBounds: function (matrix, options) {
        var bounds = new Rectangle(
            0, 0,
            this.rectangle.width,
            this.rectangle.height
        );

        return matrix ? matrix._transformBounds(bounds) : bounds;
    },

    /**
     * {@grouptitle Rectangle}
     *
     * The rectangle text is wrapped around
     *
     * @name AreaText#rectangle
     * @type Rectangle
     * @default 'new paper.Rectangle(0, 0)'
     */

    /**
     * {@grouptitle EventListeners}
     *
     * Adds a new event listener to the edit mode text change
     * Returns callback which will remove the listener from the listeners
     *
     * @name AreaText#addEditModeListener
     * @function
     * @return {AnyCallback}
     * @param {EventCallback} listener the callback function
     */

    /**
     * {@grouptitle EventListeners}
     *
     * Adds a new event listener to the edit mode change
     * Returns callback which will remove the listener from the listeners
     *
     * @name AreaText#addModeChangeListener
     * @function
     * @return {AnyCallback}
     * @param {BooleanCallback} listener the callback function
     */

    /**
     * {@grouptitle Justification}
     *
     * Current justification of the TextArea
     *
     * @name AreaText#justification
     * @type TextJustification
     * @values 'left', 'right', 'center'
     * @default 'center'
     */

    /**
     *
     * The font-weight to be used in text content.
     *
     * @name TextItem#fontWeight
     * @type String|Number
     * @default 'normal'
     */

    /**
     * {@grouptitle Content}
     *
     * Lines (array of strings) representation of the content from TextArea
     *
     * @name AreaText#lines
     * @type Array
     * @values ['first line', 'second line', 'third line']
     * @default ['']
     */

    /**
     * {@grouptitle Editmode}
     *
     * Define the mode of AreaText (can be edit mode or not edit mode).
     * In the edit mode the special input
     * field should open for the editing content
     *
     * @name AreaText#editMode
     * @type Boolean
     * @default false
     */

    /**
     * {@grouptitle Content}
     *
     * Define the mode of AreaText (can be edit mode or not edit mode).
     * In the edit mode the special input
     * field should open for the editing content
     *
     * @name AreaText#textTransform
     * @type TextTransform
     * @default 'initial'
     */

    /**
     * {@grouptitle HtmlId}
     *
     * ID of the HTML element
     *
     * @name AreaText#htmlId
     * @type String
     * @default 'area-text'
     */

    /**
     *
     * Defines the way of rendering text
     * Default if auto-width, meaning the overflown text will be drawn outside the bounds.
     * If 'auto-width' then draw on one line. If 'auto-height' then adjust the height
     * Bounds generator
     *
     * @name AreaText#boundsGenerator
     * @type BoundsGenerator
     * @default 'auto-width'
     */

    /**
     *
     * HTML element name
     *
     * @name AreaText#editElement
     * @type String
     * @default 'text-area'
     */

    /**
     *
     * Amount of space between elements in the row
     *
     * @name AreaText#spacing
     * @type TextLetterSpacing
     * @default 'normal'
     */
}, {
    statics:  /** @lends AreaText */ {
        /**
         * @protected
         * @type String
         * @readonly
         */
        _htmlParentId: 'area-text-parent',
        /**
         * @protected
         * @type Record<string, string>
         * @readonly
         */
        _spaceSeparators: { nonBreaking: '&nbsp;', thinSpace: '&thinsp;' },
        /**
         * @protected
         * @type Record<string, string>
         * @readonly
         */
        _allowedElements: { input: 'input', textArea: 'textarea'},
        /**
         * Returns available bounds generators for the area-text
         *
         * @type BoundsGenerator[]
         * @static
         * @readonly
         *
         */
        boundsGenerators: ['auto', 'auto-width', 'auto-height' ],
    }
});
