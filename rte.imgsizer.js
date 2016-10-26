var imgsizer_default_width = 250;
var imgsizer_default_link_title = 'Click Here';
var imgsizer_width_message = 'Enter width in pixels\r\nLeave blank to use original image width';

function ImgSizerOverlay($editor) {
	this.$current = null;
	this.$editor = $editor;
	this.$toolbar = null;
	this.$tmp = null;

	this._add_buttons();
	this._bind_toolbar();
}

ImgSizerOverlay.prototype = {
	_actions: function() {
		var foo = this;
		var curr = this.$current;
		return {
			delete: function() {
				curr.detach();
			},
			float_left: function() {
				curr.css({'float': 'left', 'text-align': ''});
				$(curr).removeClass().addClass('rte_left');
			},
			float_right: function() {
				curr.css({'float': 'right', 'text-align': ''});
				$(curr).removeClass().addClass('rte_right');
			},
			float_none: function() {
				curr.css({'float': 'none', 'text-align': 'center'});
				$(curr).removeClass().addClass('rte_center');
			},
			resize: function() {
				var width = prompt(imgsizer_width_message, curr.children('img').css('width').replace('px',''));
				foo.$editor.focus();
				curr.attr('data-width', width);
				curr.children('img').css('width', width);
			}
		}
	},
	_add_buttons: function() {
		this.$toolbar = $('<ul/>', { class: 'imgsizer-toolbar', contenteditable: 'false' })
			.append(this._create_button('float_left', '&#xf177;'))
			.append(this._create_button('float_none', '&#xf07e;'))
			.append(this._create_button('float_right', '&#xf178;'))
			.append(this._create_button('resize', '&#xf0b2;'))
			.append(this._create_button('delete', '&#xf1f8;'))
	},
	_bind_toolbar: function() {
		var foo = this;
		this.$editor.on('mousedown', 'figure img', function(){
			$('.imgsizer-dragging').removeClass('imgsizer-dragging');
			$(this).addClass('imgsizer-dragging');
		});
		this.$editor.on('dragstart', 'figure img', function(e) {
			foo.$toolbar.detach();
			foo.$tmp = $(this).parent().clone();
		});
		this.$editor.on('dragend', function(e) {
			$('.imgsizer-dragging').replaceWith( foo.$tmp.get(0) );
			foo.$tmp = null;
		});
		this.$editor.on('mouseenter', 'figure', function() {
			foo.$current = $(this);
			if (!foo.$current) return;
			if (foo.dragging) return;

			if (!$(this).hasClass('imgsizer-figure')) {
				$(this).addClass('imgsizer-figure');
			}
			$(this).append(foo.$toolbar);
		});
		this.$editor.on('mouseleave', 'figure', function(e) {
			foo.$toolbar.detach();
			foo.$current = null;
		});
	},
	_create_button: function($name, symbol) {
		var foo = this;
		var li = $('<li/>');
		var button = $('<a/>', { href: '#', title: 'button', class: 'imgsizer-' + $name })
			.html(symbol)
			.attr('draggable', false);

		button.click(function(e) {
			e.preventDefault();
			foo._actions()[$name]();
		});
		button.mouseover(function(e) {
			e.preventDefault();
		});

		return li.append(button);
	}
}

WysiHat.addButton('imgsizer_rte', {
	cssClass: 'rte-imgsizer',
	title: EE.rte.imgsizer.title,
    label: EE.rte.imgsizer.label,
	init: function(name, $editor) {
		var foo = this;
		this.$editor = $editor.data('wysihat');
		new ImgSizerOverlay($editor);

		$editor.on('click', function(){
			foo.saved_ranges = foo.Commands.getRanges();
		});
		return this.parent.init(name, $editor);
	},
	handler: function (state, finalize) {
		var foo = this;
		var html = '';

		this.finalize = finalize; // need this for undo support

		if (!foo.$element.hasClass('m-link')) {
			// add FilePicker properties to button
			foo.$element.attr('rel', 'modal-file');
			foo.$element.addClass('m-link');
			foo.$element.attr('href', EE.rte.imgsizer.url);

			// setup FilePicker
			foo.$element.FilePicker({
				callback: function(data, references) {
					references.modal.find('.m-close').click();
					if (data.mime_type == 'image/jpeg'
						|| data.mime_type == 'image/gif'
						|| data.mime_type == 'image/png') {
						var alt_text = prompt('Enter alt text (optional)', '');
						var width = prompt(imgsizer_width_message, imgsizer_default_width);

						var src = data.thumb_path;
						if (width == '' || src == '') src = data.path;

						$out = $('<figure />', {
								'class': 'imgsizer-figure',
								'data-src': data.path,
								'data-width': width,
							})
							.append($('<img />', {
								'alt': alt_text,
								'src': src,
								'width': width,
							}));
					} else {
						var title = prompt('Link title', 'Click Here');
						if (title == '') title = imgsizer_default_link_title;
						$out = $('<a />', { href: data.path }).html(title);
					}
					foo.$editor.focus();
					foo.Commands.restoreRanges(foo.saved_ranges);
					foo.saved_ranges[0].insertNode( $out.get(0) );
					foo.finalize(); // need this for undo support
					return false;
				}
			});
			foo.$element.click();
		}
		return false;
	}
});
