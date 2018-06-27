Arckane.model('consumption', {
	items: function (fn) {
		var el,
			items = this.game.levels[this.game.level],
			tmpl = this.game.config.tmpl;

		this.each(items, function (chunk, i) {
			if (this.game.data.chunk != i) return;

			this.each(chunk, function (ec) {
				tmpl.child.attr.src = tmpl.parent.child[0].child[0].attr.src = tmpl.dir + ec.src;
				tmpl.child.attr.alt = tmpl.parent.child[0].child[1].text = ec.name;

				el = this.DOM.fromConfig(ec.child ? tmpl.child : tmpl.parent);

				el.define({
					couple: ec.couple
				});

				this.models.find('index').query(el);

				if (ec.child) {
					this.DOM.set('item', el);
				} else {
					el.define({
						advice: ec.advice
					});

					this.DOM.set('couple', el);
				}
			});
		}, function () {
			this.DOM.setEvents({
				list: ['item', 'couple']
			});

			this.game.data.trigger('setCurrent');

			fn.call(this);
		});
	}
}).events.extend({
	show: {
		item: function (e) {
			var el = this.subsets.get(this.model.game.data.current);

			this.model.DOM.find('mask').append(el);
			this.model.DOM.find('falcon').trigger('say', el.alt);
		},
		couple: function (e) {
			this.each(this.subsets, function (el) {
				this.model.DOM.find('grid').append(el);
			});
		}
	},
	change: {
		item: function (e) {
			this.subsets.get(this.model.game.data.current).addClass('hide');

			this.model.game.data.trigger('setCurrent');
			this.trigger('show');
		}
	},
	reset: {
		item: function (e) {
			this.remove();
			this.parent.unset(this._name);
		},
		couple: function (e) {
			this.remove();
			this.parent.unset(this._name);
		}
	},
	say: {
		falcon: function (e) {
			var txt = e.triggerData,
				config = this.model.game.config.falcon;

			if (!txt) return;

			this.txt(this.model.models.find('lang').get(config[txt] || txt));
		}
	},
	click: {
		couple: function (e) {
			var el = this.model.DOM.find('item').subsets.get(this.model.game.data.current),
				target = this.q('.target');

			this.q('.bg-orange').addClass('bg-game-' + (el.couple == this.couple ? 'green' : 'red'));

			if (el.couple == this.couple) {
				target.addClass('bg-orange');
				target.q('img').src = el.src;
				target.q('div').txt(el.alt);

				this.model.DOM.find('falcon').trigger('say', this.advice);
				this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;

				setTimeout(function (item) {
					item.model.trigger('check', 'el-' + item._index + '-chunk-' + item.model.game.data.chunk);
				}, this.model.game.data.falcon.advice.speed, this);
			} else {
				this.model.DOM.find('falcon').trigger('say', 'error');
				this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;

				setTimeout(function (item) {
					item.model.DOM.find('falcon').trigger('say', el.alt);
				}, this.model.game.data.falcon.speed, this);
			}

			setTimeout(function (item) {
				item.q('.bg-game-red').removeClass('bg-game-red');
				item.q('.bg-game-green').removeClass('bg-game-green');
			}, 100, this);
		}
	},
	this: {
		init: function (e) {
			var i,
				levels = this.game.config.levels[this.game.level],
				total = 2;

			this.game.data.set('chunk', 0);
			this.game.data.set('falcon', this.game.config.falcon);
			this.game.data.total = (this.size(levels[this.game.data.chunk]) * this.size(levels)) / 2;

			this.game.data.on('setCurrent', function () {
				i = Math.floor(Math.random() * total);

				if (this.found.size() != this.total) {
					do {
						i = Math.floor(Math.random() * total);
					} while (this.found.find('el-' + i + '-chunk-' + this.chunk));

					this.current = i;
				}
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

				this.items(function () {
					this.DOM.find('item') ? this.DOM.find('item').trigger('show') : false;
					this.DOM.find('couple') ? this.DOM.find('couple').trigger('show') : false;
				});
			} else {
				this.DOM.find('item') ? this.DOM.find('item').trigger('change') : false;
			}
		},
		level: function (e) {
			this.DOM.find('falcon').trigger('say', 'finish');

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
					this.model.DOM.find('couple').trigger('show');
				};

			if (!this.DOM.find('mask')) {
				this.DOM.set('mask', mask, true);
				this.game.view.set('index', mask, true);
				this.models.find('index').query(mask);

				this.DOM.find('original').on('load', load, true);
			}

			this.items(function () {
				e.triggerData ? this.DOM.find('item').trigger('show') : false;
				e.triggerData ? this.DOM.find('couple').trigger('show') : false;
			});
		}
	}
});