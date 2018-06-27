Arckane.model('differences').events.extend({
	load: {
		element: function (e) {
			var span = this.create('span', {
					class: this.getAttribute('class'),
					style: this.getAttribute('style')
				}).define({
					sel: this.sel
				}).css({
					width: this.width + 'px',
					height: this.height + 'px'
				})
				.on('click', this.model.events.click.element);

			this.model.DOM.set('fake', span);

			span._index = this._index;

			this.model.DOM.find('original').domParent().append(span);
		}
	},
	show: {
		element: function (e) {
			e.triggerData.append(this);
		}
	},
	reset: {
		element: function (e) {
			this.css({
				opacity: 1
			});
		}
	},
	click: {
		element: function (e) {
			var el = this.matches('span') ? this.model.DOM.find('element').subsets.get(this._index) : this;

			if (this.model.game.data.found.find(this._index + 1)) return;

			this.model.trigger('check', this._index + 1);

			el.css({
				opacity: 0
			});

			this.each([this.parent.find('target'), this.parent.find('original')], function (img) {
				img.domParent().append(this._element.create('b', {
					class: 'absolute game-color-green size-30',
					style: this.getAttribute('style')
				}).txt('✓').css({
					opacity: 1,
					height: false,
					weight: false
				}));
			});

			this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;
		},
		original: function() {
			this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;
		}
	},
	this: {
		init: function (e) {
			this.game.data.total = this.size(this.game.levels[this.game.level].items);
		},
		check: function (e) {
			this.game.data.found.set(e.triggerData, {
				time: this.game.timer.time
			});
		},
		retry: function (e) {
			this.DOM.trigger('reset', false, true, true);
		},
		next: function (e) {
			this.game.view.unset('index');
			this.DOM.empty();
			this.trigger('start');
		},
		start: function (e) {
			var el,
				i = 0,
				config = this.game.levels[this.game.level],
				mask = this.DOM.fromConfig(config.mask),
				load = function (e) {
					i += 1;

					if (i == 2) {
						this.model.DOM.find('original').removeClass('hide');
						this.model.DOM.find('target').removeClass('hide');
						this.model.DOM.find('element').trigger('show', this.model.DOM.find('target').domParent(), true);
					}
				};

			this.DOM.set('mask', mask, true);
			this.game.view.set('index', mask, true);

			this.models.find('index').query(mask);

			this.each(config.items, function (ec, i) {
				el = this.DOM.fromConfig(ec);

				el.css({
					top: ec.top + 'px',
					left: ec.left + 'px'
				});

				this.DOM.set('element', el);
			}, function () {
				this.DOM.setEvents({
					list: ['element']
				});

				this.DOM.find('target').on('load', load, true);
				this.DOM.find('original').on('load', load, true);
			});
		}
	}
});