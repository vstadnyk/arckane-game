Arckane.model('growing', {
	item: function (ec, type) {
		var config = this.game.config,
			el = this.DOM.fromConfig(config.item[type]).extend({
				cell: ec.cell
			}).css({
				backgroundImage: 'url(' + config.item.dir + ec.src + ')'
			});

		return el;
	},
	build: function (fn) {
		var item,
			level = this.game.levels[this.game.level],
			config = this.game.config,
			w = config.grid.width / level.cells,
			h = config.grid.height / level.cells,
			cells = [];

		for (var i = 0; i < (level.cells * level.cells); i++) {
			cells.push(i);
		}

		this.each(cells, function (t, i) {
			item = this.DOM.fromConfig(config.item.cell).css({
				width: w + 'px',
				height: h + 'px',
			});

			config.devmode ? item.append(this.DOM.create('span', {
				class: 'absolute row-100 color-white',
				style: 'left: 0; top: 40%;'
			}).txt(i)) : false;

			item.extend({
				path: config.item.dir
			});

			this.DOM.set('cell', item);
			this.DOM.find('grid').append(item);
		}, function () {
			this.DOM.setEvents({
				list: ['cell']
			});

			item = null;
		});

		this.each(level.items, function (ec) {
			this.DOM.set('clog', this.item(ec, ec.type));
		}, function () {
			this.DOM.setEvents({
				list: ['clog']
			}).find('clog').trigger('show', false, true);
		});

		!config.devmode ? this.DOM.find('cell').trigger('fogSet', false, true) : false;

		if (this.DOM.find('tree')) return;

		this.each(config.trees, function (tree) {
			this.DOM.set('tree', this.DOM.fromConfig(config.item.tree).extend({
				src: tree
			}).css({
				backgroundImage: 'url(' + config.item.dir + tree + ')'
			}));
		}, function () {
			this.DOM.setEvents({
				list: ['tree']
			}).find('tree').trigger('show', false, true);
		});
	}
}).events.extend({
	show: {
		clog: function (e) {
			this.model.DOM.find('cell').subsets.get(this.cell).append(this).extend({
				clog: true
			});
		},
		tree: function (e) {
			this.model.DOM.find('holder').append(this);
		}
	},
	load: {
		falcon: function (e) {
			this.trigger('say', {
				text: 'start',
				speed: 500
			});
		}
	},
	click: {
		cell: function (e) {
			if (!this.model.game.config.devmode) return;
			this.toggleClass('bg-orange');
		}
	},
	fogSet: {
		cell: function (e) {
			var config = this.model.game.config,
				fog = this.model.DOM.fromConfig(config.item.fog);

			this.model.DOM.find('falcon').trigger('say', {
				text: 'fog',
				speed: config.fog.setSpeed + 500
			});

			setTimeout(function (cell) {
				cell.append(fog);
			}, config.fog.setSpeed * 1.5, this);
		}
	},
	fogDel: {
		cell: function(e) {
			this.q('.absolute-top').css({
				backgroundColor: 'rgba(0,0,0,0)'
			});
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
	dragstart: {
		tree: function (e) {
			e.dataTransfer.setData('text', this.src);
			e.dataTransfer.effectAllowed = 'move';
		}
	},
	dragover: {
		cell: function (e) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		}
	},
	dragleave: {
		cell: function (e) {
			e.preventDefault();
		}
	},
	drop: {
		cell: function (e) {
			var speed = this.model.game.config.falcon.speed;

			e.preventDefault();

			this.model.DOM.find('falcon').trigger('say', {
				text: this.clog ? 'error' : 'correct',
				speed: 1
			});

			if (this.clog) {
				setTimeout(function (cell) {
					cell.removeClass('red-8');
				}, 300, this.addClass('red-8'));
			} else {
				this.q('div').css({
					backgroundImage: 'url(' + this.path + e.dataTransfer.getData('text') + ')',
					backgroundColor: false
				});

				if (this.model.game.data.found.size() + 1 === this.model.game.data.total) {
					this.model.DOM.find('falcon').trigger('say', {
						text: 'finish',
						speed: 1
					});

					setTimeout(function (cell) {
						cell.trigger('fogDel', false, true);
					}, speed / 2, this.model.DOM.find('cell'));

					setTimeout(function (model) {
						model.trigger('check', 'el-' + (e.target._index + 1));
					}, speed * 2, this.model);
				} else {
					this.model.trigger('check', 'el-' + (this.trigger('fogDel')._index + 1));
				}
			}
		}
	},
	reset: {
		falcon: function (e) {
			this.trigger('say', {
				text: 'start',
				speed: 1
			});
		},
		cell: function (e) {
			this.parent.unset(this._name);
			this.remove();
		},
		clog: function (e) {
			this.parent.unset(this._name);
			this.remove();
		}
	},
	this: {
		init: function (e) {
			var level = this.game.levels[this.game.level];
			this.game.data.total = (level.cells * level.cells) - this.size(level.items);
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
				e.triggerData ? this.DOM.find('item').trigger('show') : false;
			});
		}
	}
});