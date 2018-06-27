Arckane.model('warming', {
	items: function (fn) {
		var el,
			items = this.game.levels[this.game.level],
			item = this.game.config.item;

		this.each(items, function (chunk, i) {
			if (this.game.data.chunk != i) return;

			this.each(chunk, function (ec) {
				item.tmpl.child[0].child[0].child[1].text = ec.name;
				item.tmpl.child[0].child[0].child[0].attr.src = item.dir + ec.src;

				el = this.DOM.fromConfig(item.tmpl);

				el.define({
					chunk: parseInt(i),
					type: ec.type
				});

				this.models.find('index').query(el);

				this.DOM.set('item', el);
			});
		}, function () {
			this.DOM.setEvents({
				list: ['item']
			});

			this.game.data.trigger('levelShuffle');

			fn.call(this);
		});
	}
}).events.extend({
	show: {
		item: function (e) {
			this.each(this.model.game.data.show, function (i) {
				this.model.DOM.find('grid').append(this.subsets.find(i));
			});
		}
	},
	click: {
		item: function (e) {
			this.q('.bg-orange').addClass('bg-game-' + (!this.type ? 'green' : 'red'));

			if (!this.type) {
				this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;
			} else {
				this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;
			}

			if (!this.type) return this.model.trigger('check', 'el-' + this._index + '-chunk-' + this.model.game.data.chunk);

			setTimeout(function (item) {
				item.q('.bg-game-red').removeClass('bg-game-red');
			}, 100, this);
		}
	},
	reset: {
		grid: function (e) {
			this.empty();
		}
	},
	this: {
		init: function (e) {
			this.game.data.set('chunk', 0);
			this.game.data.total = this.size(this.game.levels[this.game.level][this.game.data.chunk]) / 2;

			this.game.data.on('levelShuffle', function () {
				var i,
					tmp,
					a = this.keys(this.parent.levels[this.parent.level][this.chunk]),
					c = a.length;

				while (0 !== c) {
					i = Math.floor(Math.random() * c);
					c -= 1;

					tmp = a[c];
					a[c] = a[i];
					a[i] = tmp;
				}

				this.show = a;
			});
		},
		check: function (e) {
			var s;

			this.game.data.found.set(e.triggerData, {
				time: this.game.timer.time
			});

			s = this.game.data.found.size() / 2;

			if (this.game.level > 1 && ((s ^ 0) === s)) {
				this.game.data.chunk += 1;

				this.DOM.trigger('reset', false, true, true);
				this.DOM.unset('item');
				this.items(function () {
					this.DOM.find('item') ? this.DOM.find('item').trigger('show') : false;
				});
			}
		},
		level: function (e) {
			this.DOM.unset('item');
			this.DOM.trigger('reset', false, true, true);
		},
		next: function (e) {
			var levels = this.game.config.levels[this.game.level];

			this.game.data.chunk = 0;
			this.game.data.total = (this.size(levels[this.game.data.chunk]) * this.size(levels)) / 2;
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

			this.items(function () {
				this.DOM.find('mask') ? this.DOM.find('item').trigger('show') : false;
			});
		}
	}
});