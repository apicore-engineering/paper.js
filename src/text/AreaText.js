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
    _allowedElements: ['input', 'textarea'],
    _htmlId: 'area-text',
    _outsideClickId: null,
    _boundsGenerators: ['auto-height', 'auto-width', 'fixed'],

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
        this._boundsGenerator = 'fixed';
        TextItem.apply(this, arguments);
        this.setRectangle(arguments[0] || new Rectangle(0, 0));
        this._htmlElement = 'textarea';
        this._onDoubleClick();
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
     * @return {string}
     */
    getBoundsGenerator: function () {
        return this._boundsGenerator;
    },

    setBoundsGenerator: function (generator) {
      if (!this._boundsGenerators.includes(generator)) {
          throw new Error('Generator ' + generator + 'is not included in ' + this._boundsGenerators.toString());
      }

      this._boundsGenerator = generator;
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

    setEditElement: function (element) {
        if (!this._allowedElements.includes(element)) {
            throw new Error("Html element with name " + element + " is not allowed");
        }
        this._htmlElement = element;
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

    setHeight: function () {
        var point = this.rectangle.getPoint();
        var size = new Size(this.rectangle.width, arguments[0]);
        var rectangle = new Rectangle(point, size);
        this.setRectangle(rectangle, false);
    },

    setWidth: function () {
        var point = this.rectangle.getPoint();
        var size = new Size(arguments[0], this.rectangle.height);
        var rectangle = new Rectangle(point, size);
        this.setRectangle(rectangle, false);
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
        this._editMode = mode || !this.editMode;
        if (this._editMode) {
            this._setEditMode();
        } else {
            this._setNormalMode();
        }
    },

    _setEditMode: function () {
        var element =  document.getElementById(this._htmlId);
        if (!element) {
            element = document.createElement(this._htmlElement);
            element.id = this._htmlId;
        }

        var canvasBoundingBox = this.view.context.canvas.getBoundingClientRect();

        element.style.width = this.rectangle.width + 'px';
        if (this._boundsGenerator === 'fixed') {
            element.style.height = '100%';
        } else {
            element.style.height = this.rectangle.height + 'px';
        }
        element.style.left = canvasBoundingBox.left + this.rectangle.left + 'px';
        element.style.top = canvasBoundingBox.top + this.rectangle.top + 0.5  + 'px';
        element.style.fontFamily = this._style.fontFamily;
        element.style.fontSize = this._style.fontSize + 'px';
        element.style.fontWeight = this._style.fontWeight;
        element.style.lineHeight = '' + this._style.leading / this.style.fontSize;
        element.style.resize = 'none';
        element.style.border = 'none';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.outline = '0';
        element.style.backgroundColor = 'transparent';

        element.value = '' + this._content;
        this.setContent('');

        element.style.position = 'absolute';

        document.body.appendChild(element);
        this._inputOutsideClick('add');
    },

    _outsideClick: function (e) {
        var element = document.getElementById(this.getHtmlId());
        if (!e.target.isSameNode(element)) {
            this._changeMode(false);
        }
    },

    _inputOutsideClick: function (/* */) {
        var self = this;
        if (arguments[0] === 'add') {
            self._outsideClickId = self._outsideClick.bind(self);
            window.setTimeout(function () {
                document.addEventListener('click', self._outsideClickId, true);
            }, 50);
        } else {
            document.removeEventListener('click', self._outsideClickId, true);
        }
    },

    _setNormalMode: function () {
        var element = document.getElementById(this._htmlId);
        this.setContent( element.value );
        element.remove();
        this._inputOutsideClick('remove');
        this._wrap(this.view.context);
    },

    _onDoubleClick: function () {
        this.on('doubleclick', function (e) {
            this._changeMode();
        });
    },

    _wrap: function (ctx) {
        this._lines = [];

        var words = this.content
                .replace(/\n/g, ' ')
                .split(' '),
            line = '';

        if (this._boundsGenerator === 'auto-width') {
            this._lines = [this.content];
            var width = ctx.measureText(this._lines[0]).width;
            this.setWidth(width);
            this.setHeight(this.getStyle().leading);
            return;
        }


        for (var i = 0; i < words.length; ++i) {
            var metrics = ctx.measureText(words[i]);

            if (metrics.width > this.rectangle.width) {
                var newSubStr = '';
                while (ctx.measureText(words[i]).width > this.rectangle.width) {
                    newSubStr += words[i].split('').pop();
                    words[i] = words[i].slice(0, -1);
                }

                if (newSubStr !== '') {
                    Base.insertAt(words, i + 1, newSubStr.split('').reverse().join(''));
                } else {
                    throw new Error('Substring is not redefined.');
                }
            }
        }

        for (var i = 0; i < words.length; i++) {
            // use metrics width to determine if the word needs
            // to be sent on the next line
            var textLine = line + words[i] + ' ',
                metrics = ctx.measureText(textLine),
                testWidth = metrics.width;
            if (testWidth > this.rectangle.width && i > 0) {
                this._lines.push(line);
                line = words[i] + ' ';
            } else {
                line = textLine;
            }
        }

        this._lines.push(line);

        if (this._boundsGenerator === 'auto-height') {
            var height = (this.getStyle().leading) * (this._lines.length );
            this.setHeight(height);
        }
    },

    _updateAnchor: function () {
        var justification = this._style.getJustification(),
            rectangle = this.getRectangle(),
            anchor = new Point(0, this._style.getFontSize());

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
            if (i * leading > rectangle.height && this._boundsGenerator === 'auto-height') {
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
     * {@grouptitle Justification}
     *
     * Current justification of the TextArea
     *
     * @name AreaText#justification
     * @type String
     * @values 'left', 'right', 'center'
     * @default 'center'
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
     * Default if fixed, meaning the overflown text will be drawn outside the bounds.
     * If 'auto-width' then draw on one line. If 'auto-height' then adjust the height
     * Bounds generator
     *
     * @name AreaText#boundsGenerator
     * @type String
     * @default 'fixed'
     */

    /**
     *
     * HTML element name
     *
     * @name AreaText#editElement
     * @type String
     * @default 'text-area'
     */
});
