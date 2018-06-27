Arckane.model('habitats', {
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
			items = this.game.levels[this.game.level],
			biome = this.game.config.bioms[this.game.level],
			item = this.game.config.item;

		this.DOM.find('biomeImage').attr({
			src: item.dir + biome.src
		});

		this.DOM.find('biomeName').txt(biome.name);

		this.each(items, function (ec) {
			item.tmpl.attr.src = item.dir + ec.src;

			el = this.DOM.fromConfig(item.tmpl);

			el.define({
				def: ec.position,
				seat: ec.seat
			});

			this.DOM.set('item', this.item.call(el, ec.position));
		}, function () {
			this.DOM.setEvents({
				list: ['item']
			});

			this.game.data.trigger('setCurrent');

			fn.call(this);
		});
	}
}).events.extend({
	show: {
		item: function (e) {
			this.each(this.subsets, function (el) {
				this.model.DOM.find('mask').append(el);
			});

			setTimeout(function (item) {
				item.trigger('say', item.model.game.data.current.desc);
			}, this.model.game.config.falcon.speed, this.model.DOM.find('falcon'));
		}
	},
	dragstart: {
		item: function (e) {
			if (this.model.game.data.current.index != this._index) return this.model.DOM.find('falcon').trigger('say', 'error');

			e.dataTransfer.setData('text', this._index);
			e.dataTransfer.effectAllowed = 'move';

			this.model.DOM.find('falcon').trigger('say', 'correct');
		}
	},
	dragover: {
		seat: function (e) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		}
	},
	drop: {
		seat: function (e) {
			var item = this.model.DOM.find('item').subsets.get(parseInt(e.dataTransfer.getData('text')));

			e.preventDefault();

			if (item) {
				this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;
			} else {
				this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;

				return;
			}

			item.attr({
				style: false
			});

			this.css({
				zIndex: 1
			}).append(this.model.item.call(item, item.seat));

			this.model.trigger('check', 'el-' + item._index);
		}
	},
	say: {
		falcon: function (e) {
			var txt = e.triggerData,
				config = this.model.game.config.falcon;

			if (!txt) return;

			this.txt(config[txt] || txt);
		}
	},
	reset: {
		item: function (e) {
			this.remove();
			this.parent.unset(this._name);
		},
		seat: function (e) {
			this.css({
				zIndex: 3
			});
		}
	},
	default: {
		item: function (e) {
			this.model.DOM.find('mask').append(this.model.item.call(this, this.def));
		},
		seat: function (e) {
			this.trigger('reset', false, true);
		}
	},
	this: {
		init: function (e) {
			this.game.data.total = this.size(this.game.levels[this.game.level]);
			this.game.data.set('current', Object.create(this.proto));

			this.game.data.on('setCurrent', function () {
				var current,
					levels = this.parent.levels[this.parent.level],
					total = this.size(levels),
					i = Math.floor(Math.random() * total);

				if (this.found.size() != this.total) {
					do {
						i = Math.floor(Math.random() * total);
					} while (this.found.find('el-' + i));

					current = this.parent.levels[this.parent.level][i];

					this.current.extend({
						index: i,
						name: current.name,
						desc: current.description
					});
				}
			});
		},
		check: function (e) {
			this.game.data.found.set(e.triggerData, {
				time: this.game.timer.time
			});

			this.game.data.trigger('setCurrent');

			setTimeout(function (item) {
				item.trigger('say', item.model.game.data.current.desc);
			}, this.game.config.falcon.speed, this.DOM.find('falcon'));
		},
		level: function (e) {
			this.DOM.find('falcon').trigger('say', 'finish');
		},
		next: function (e) {
			this.game.data.total = this.size(this.game.levels[this.game.level]);

			this.DOM.trigger('reset', false, true, true);

			this.trigger('start', true);
		},
		start: function (e) {
			var mask = this.DOM.fromConfig(this.game.config.mask),
				load = function (e) {
					this.removeClass('hide').model.DOM.find('mask').attr({
						style: false
					});
					this.model.DOM.find('item').trigger('show');
				};

			if (!this.DOM.find('mask')) {
				this.DOM.set('mask', mask, true);
				this.game.view.set('index', mask, true);
				this.models.find('index').query(mask);

				this.DOM.find('original').on('load', load, true);
			}

			this.build(function () {
				e.triggerData ? this.DOM.find('item').trigger('show') : false;
			});
		}
	}
});