Arckane.model('air', {
	item: function (config) {
		this.attr({
			alt: config.name,
			src: config.src
		}).css({
			left: config.left + 'px',
			top: config.top + 'px'
		}).extend({
			advice: config.advice
		});

		config.rotate ? this.css({
			'transform': 'rotate(' + config.rotate + 'deg)'
		}) : false;

		return this;
	},
	build: function (fn) {
		var level = this.game.levels[this.game.level],
			config = this.game.config.tmpl;

		this.DOM.find('screen').attr({
			style: 'opacity: 0;',
			src: config.dir + level.screen
		});

		this.each(level.items, function (ec) {
			ec.src = config.dir + ec.src;

			this.DOM.set('item', this.item.call(this.DOM.fromConfig(config.item), ec));
		}, function () {
			this.DOM.setEvents({
				list: ['item']
			});
			fn.call(this);
		});
	}
}).events.extend({
	load: {
		falcon: function (e) {
			this.trigger('say', {
				text: 'start',
				speed: 500
			});
		}
	},
	show: {
		item: function (e) {
			this.model.DOM.find('mask').append(this);
		},
		screen: function (e) {
			this.attr({
				style: false
			});
		}
	},
	click: {
		item: function (e) {
			var index = this._index,
				check = this.model.DOM.fromConfig(this.model.game.config.tmpl.check).attr({
					style: this.getAttribute('style')
				});

			this.model.DOM.set('check', check);
			this.model.DOM.setEvents({
				list: ['check']
			});

			this.model.DOM.find('mask').append(check);

			this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;

			this.model.DOM.find('falcon').trigger('say', {
				text: this.advice,
				speed: 1,
				fn: function (falcon) {
					falcon.trigger('say', {
						text: 'correct',
						fn: function (falcon) {
							falcon.model.trigger('check', 'el-' + index);
						}
					});
				}
			});
		},
		screen: function (e) {
			this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;
		}
	},
	say: {
		falcon: function (e) {
			if (!e.triggerData || typeof e.triggerData != 'object') return;

			var options = e.triggerData,
				config = this.model.game.config.falcon;

			setTimeout(function (falcon) {
				falcon.txt(config[options.text] || options.text);
				typeof options.fn == 'function' ? options.fn(falcon) : false;
			}, (options.speed || config.speed), this);
		}
	},
	reset: {
		falcon: function (e) {
			this.trigger('say', {
				text: 'start',
				speed: 1
			});
		},
		item: function (e) {
			this.parent.unset(this._name);
			this.remove();
		},
		check: function (e) {
			this.parent.unset(this._name);
			this.remove();
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
		next: function (e) {
			this.trigger('init');
			this.DOM.trigger('reset', false, true, true);
			this.trigger('start', true);
		},
		start: function (e) {
			var mask = this.DOM.fromConfig(this.game.config.mask);

			if (!this.DOM.find('mask')) {
				this.DOM.set('mask', mask, true);
				this.game.view.set('index', mask, true);
				this.models.find('index').query(mask);
			}

			this.build(function () {
				this.DOM.trigger('show', false, true, true);
			});
		}
	}
});