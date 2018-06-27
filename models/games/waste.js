Arckane.model('waste', {
	item: function (config) {
		this.css({
			left: config.left + 'px',
			top: config.top + 'px'
		});

		config.rotate ? this.css({
			'transform': 'rotate(' + config.rotate + 'deg)'
		}) : false;

		return this;
	},
	build: function (fn) {
		var el,
			kid,
			mask = this.game.config.mask,
			maskLevels = this.game.config.maskLevels[this.game.level],
			items = this.game.levels[this.game.level],
			tmpl = this.game.config.tmpl,
			load = function (e) {
				this.removeClass('hide').model.DOM.find('mask').attr({
					style: false
				});
				this.model.DOM.find('item').trigger('show', false, true);
			};

		this.each(items, function (ec) {
			tmpl.item.attr.src = tmpl.dir + ec.src;
			tmpl.item.attr.alt = ec.name;

			el = this.DOM.fromConfig(tmpl.item);

			el.define({
				type: ec.type,
				tmpl: ec
			});

			this.DOM.set('item', this.item.call(el, ec));
		}, function () {
			this.DOM.setEvents({
				list: ['item']
			});
		});

		mask.child[0].attr.src = tmpl.dir + maskLevels.original;

		mask = this.DOM.fromConfig(mask);

		this.each(maskLevels.kids, function (kc, name) {
			tmpl.kid.attr.alt = name;
			tmpl.kid.attr.src = tmpl.dir + kc.src;

			kid = this.DOM.fromConfig(tmpl.kid);

			this.each(kc.position, function (value, prop) {
				kid.css({
					[prop]: value + 'px'
				});
			});

			mask.append(kid);
		});

		this.DOM.set('mask', mask, true);

		this.DOM.setEvents({
			list: ['mask']
		});

		this.game.view.set('index', mask);
		this.models.find('index').query(mask);

		this.DOM.find('original').on('load', load);
	}
}).events.extend({
	show: {
		item: function (e) {
			this.model.DOM.find('mask').append(this);
		}
	},
	dragstart: {
		item: function (e) {
			e.dataTransfer.setData('text', this._index);
			e.dataTransfer.effectAllowed = 'move';
		}
	},
	dragover: {
		box: function (e) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		},
		original: function (e) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		}
	},
	drop: {
		box: function (e) {
			var item = this.model.DOM.find('item').subsets.get(parseInt(e.dataTransfer.getData('text')));

			e.preventDefault();

			if (item.type === this.dataset.type) {
				this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;
			} else {
				this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;

				return;
			}

			this.append(item.attr({
				style: false
			}).css({
				left: '42.5px',
				top: '-30px'
			}));

			this.model.trigger('check', 'el-' + item._index);
		},
		original: function (e) {
			var item = this.model.DOM.find('item').subsets.get(parseInt(e.dataTransfer.getData('text')));

			e.preventDefault();

			if (!item || !item.position) return;

			item.css({
				left: (e.layerX - (item.position.width / 2)) + 'px',
				top: (e.layerY - (item.position.height / 2)) + 'px'
			});

			log(item.alt + ' left: ' + (e.layerX - (item.position.width / 2)) + ' top: ' + (e.layerY - (item.position.height / 2)));
		}
	},
	reset: {
		item: function (e) {
			this.model.item.call(this, this.tmpl);
			this.trigger('show');
		}
	},
	this: {
		init: function (e) {
			this.game.data.total = this.size(this.game.levels[this.game.level]);
		},
		check: function (e) {
			this.game.data.found.set(e.triggerData, {
				time: this.game.timer.time
			});
		},
		reset: function (e) {
			if (this._name == 'DOM') return;

			this.DOM.empty();

			this.game.view.unset('index');
		},
		finish: function (e) {
			this.trigger('reset');
		},
		next: function (e) {
			this.trigger('reset, init, start');
		},
		start: function (e) {
			this.build();
		}
	}
});