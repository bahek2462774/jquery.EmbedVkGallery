(function($) {
    $(function() {
        var nps = 'EmbedVkGallery';
        $[nps] = {
            /**
             * Can be [s,m,x,o,p,q,y,z,w]
             * Look into https://vk.com/dev/photo_sizes
             */
            full_image_size: 'x',
            width: 100,
            margin: 4,
            rev: 1,
            link: '',
            link_mapper: function(el){
                return [
                    el.href,
                    '<a href="'+el.href+'">'+el.title+'</a>'
                ]
            }
        };

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        $.fn[nps] = function(opts) {
            opts = opts || {};
            opts = (typeof(opts) !== 'object' ) ? {link:opts} : opts;
            var localOpts = $.extend({}, $[nps], opts),
                json;
            function showAlbum() {
                var $this = $(this),
                    gallerySetName = 'gallerySetName' + +new Date(),
                    meta_opts = $.extend({}, localOpts, $this.data()),
                    res = /(-?\d+)_(\d+)/g.exec(meta_opts.link);
                    if (!res || res.length < 3) {return;}
                /**
                 * photo_sizes=1 returns special formats
                 * https://vk.com/dev/photo_sizes
                 */
                var query = 'https://api.vk.com/method/photos.get?&photo_sizes=1&extended=1&album_id=' + res[2]
                    + '&owner_id=' + res[1]
                    + '&rev=' + meta_opts.rev
                    /**
                     * Version of VK API
                     */
                    + '&v=5.62&callback=?';
                if (meta_opts.width < 0) {return;}
                meta_opts.height = meta_opts.width - (meta_opts.width / 2 ^ 0);

                function resize($img) {
                    var $div = $img.closest('div'),
                        d_h = $div.height(),
                        d_w = $div.width(),
                        i_h = $img.height(),
                        i_w = $img.width();
                    var max = d_h > d_w ? d_h : d_w;
                    if (i_h > i_w) { $img.width(max); } else { $img.height(max); }
                    return $img;
                }

                function getCountRows(count, width, parentWidth) {
                    var min = parentWidth / width ^ 0,
                        result = [];
                    if (count <= min) {
                        return [count];
                    } else {
                        while (count > 0) {
                            if ((count - min) > min) {
                                result[result.length] = min;
                            } else {
                                result[result.length] = count / 2 ^ 0;
                                result[result.length] = count - result[result.length - 1];
                                count = 0;
                            }
                            count -= result[result.length - 1];
                        }
                    }
                    for (var i = 0; i < result.length; i++) {
                        if (i % 2 == 0) {
                            if (i <= (result.length-2)) {
                                if (result[i] > 3 && result[i+1] > 3) {
                                    var max = (result[i] / 3 ^ 0) < (result[i+1] / 3 ^ 0) ?
                                        result[i] / 3 ^ 0 : result[i + 1] / 3 ^ 0,
                                        plusOrMinus = Math.random() < 0.5 ? -1 : 1,
                                        a = getRandomInt(1, max) * plusOrMinus;
                                    result[i] += a;
                                    result[i + 1] -= a;
                                }
                            }
                        }
                    }
                    return result;
                }

                function expanding($row) {
                    var $divs = $('div', $row),
                        totalWidth = $divs.length * meta_opts.margin,
                        diff,
                        newWidth,
                        newHeight;
                    $divs.each(function() {
                        totalWidth += $(this).data('newWidth');
                    });
                    totalWidth = totalWidth ^ 0;
                    var a = (totalWidth > $this.width()) ? -1 : 1;
                    while ( totalWidth != $this.width() ) {
                        diff = ($this.width() - totalWidth ^ 0 ) / $divs.length ^ 0;
                        diff = Math.abs(diff);
                        if (diff > 2) { a *= diff; }
                        $divs.each(function() {
                            newWidth = $(this).data('newWidth') + a;
                            $(this).data({ newWidth: newWidth });
                            totalWidth += a;
                            return (totalWidth != $this.width());
                        });
                        newHeight  = $divs.eq(0).data('newHeight') + a;
                        $divs.data('newHeight', newHeight);
                        a = (totalWidth > $this.width()) ? -1 : 1;
                    }
                    $divs.each(function() {
                        $(this).css({
                            width: $(this).data('newWidth'),
                            height: $(this).data('newHeight'),
                            float: 'left',
                            marginRight: meta_opts.margin + 'px',
                            marginTop: meta_opts.margin + 'px',
                            boxSizing: 'border-box',
                            overflow: 'hidden'

                        });
                        var $a = $('<a/>', {
                                href: $(this).data('maxSrc'),
                                rel: gallerySetName,
                                'class': 'embedvkgallery_link',
                                'data-lightbox': gallerySetName,
                                title: $(this).data('text')
                            }),
                            $img = $('<img/>', { 
                                src: $(this).data('src'),
                                'class': 'embedvkgallery_img'
                                
                            })
                                .css({ margin: 0 })
                                .load(function() {
                            resize( $(this) );
                            });
                        $a.append($img).appendTo( $(this) );
                    });
                    return $row;
                }

                function renderAlbumList(data) {
                    if (data.response && data.response.count > 0) {
                        json = data;
                        var arr = getCountRows(data.response.count, meta_opts.width,  $this.width()),
                            sizes = 2,
                            item = 0;
                        for (var i = 0; i < arr.length; i++) {
                            var $row = $('<div/>');
                            for (var j = 0; j < arr[i]; j++) {
                                var c_height = data.response.items[item].sizes[sizes].height,
                                    c_width = data.response.items[item].sizes[sizes].width,
                                    newWidth = c_width * meta_opts.height / c_height ^ 0,
                                    maxSrc,
                                    grepResults;

                                /**
                                 * Finding the maxSrc url which we need
                                 */
                                grepResults = $.grep(data.response.items[item].sizes, function(size) {
                                    return size.type == localOpts.full_image_size;
                                });
                                if ( ! grepResults || ! grepResults.length ) {
                                    grepResults = $.grep(data.response.items[item].sizes, function(size) {
                                        return size.type == 'm';
                                    });
                                    if ( ! grepResults || ! grepResults.length ) {
                                        grepResults = $.grep(data.response.items[item].sizes, function(size) {
                                            return size.type == 's';
                                        });
                                    }
                                }
                                if ( ! grepResults || ! grepResults.length ) {
                                    continue;
                                }
                                maxSrc = grepResults[0].src;


                                $('<div/>').data({
                                    newHeight: meta_opts.height,
                                    newWidth: newWidth,
                                    src: data.response.items[item].sizes[sizes].src,
                                    text: data.response.items[item].text,
                                    maxSrc: maxSrc
                                }).appendTo($row);
                                item++;
                            }
                            expanding($row).appendTo($this);
                            if ($.fn.slimbox){
                                $('a', $this).slimbox({}, meta_opts.link_mapper);
                            } else if ($.fn.swipebox) {
                                $('a.embedvkgallery_link', $this).swipebox({}, meta_opts.link_mapper);
                            }
                        }
                    } else {
                        $this.text('Album not found');
                    }
                }
                if (!json) {$.getJSON(query, renderAlbumList);} else {renderAlbumList(json);}
            }
            return this.each(showAlbum);
        };
    });
})(jQuery);
