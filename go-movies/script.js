const API_KEY = '68600ee078a7e72d5abc22065b49b33a';
const BASE_URL_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const BASE_URL_IMG_W500 = 'https://image.tmdb.org/t/p/w500/';
const API_MOVIE_NOW_PLAYING = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&`;
const API_MOVIE_UPCOMING = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&`;
const API_MOVIE_TOP_RATED = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=en-US&`;
const API_TV_AIRING_TODAY = `https://api.themoviedb.org/3/tv/airing_today?api_key=${API_KEY}&language=en-US&`;
const API_TV_TOP_RATED = `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=en-US&`;

const SEARCH_INPUT = '#navSearchInput';
const SLIDER_MOVIE = '#sliderMovie';
const SLIDER_TV = '#sliderTv';
const SLIDER_PADDING = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--slider-gap').replace('rem', '') * 16 * 2);
const FADE_DELAY = 600;

let carouselItems = [];
let movieItems = [];
let tvItems = [];

class Slider {
    constructor(element) {
        this.element = element;
        this.maxScrollWidth = element[0].scrollWidth;
        this.sliderWidth = element.innerWidth();
        this.itemPerGroup = Math.floor(this.sliderWidth / element.children().first().innerWidth());
        this.groupWidth = element.children().first().innerWidth() * this.itemPerGroup + SLIDER_PADDING * 2;
        this.indicators = null;
        this.btnLeft = element.siblings('.slider-btn-left');
        this.btnRight = element.siblings('.slider-btn-right');

        this.lastGroupItemCount = element.children().length - Math.floor((element.children().length / this.itemPerGroup) * this.itemPerGroup);
        this.lastGroupWidth = element.children().first().innerWidth() * this.lastGroupItemCount + SLIDER_PADDING * 2;
    }

    scrollTo(direction) {
        const scrolledLeft = this.element.scrollLeft();
        const currentGroup = Math.round(scrolledLeft / (this.groupWidth - 1)) + 1;

        if (direction === -1) {
            this.element.scrollLeft((currentGroup - 2) * this.groupWidth);
        }
        if (direction === 1) {
            this.element.scrollLeft(currentGroup * this.groupWidth);
        }
    }

    setIndicator() {
        this.indicators = this.element.parent().siblings('.group-header').children('.slider-indicator');
        const indicatorCount = this.element.children().length / this.itemPerGroup;
        let isActive = '';
        this.indicators.children().remove();
        for (let i = 0; i < indicatorCount; i++) {
            if (i === 0) {
                isActive = ' active';
            } else {
                isActive = '';
            }
            this.indicators.append(`<div class="slider-indicator-index${isActive}" data-indicator-index="${i}" data-target="#${this.element.attr('id')}"></div>`);
        }
    }

    scrollPosition() {
        const currentScrollLeft = this.element.scrollLeft();
        let groupIndex = Math.floor(currentScrollLeft / this.groupWidth);
        const from = this.indicators.children('.active').data('indicatorIndex');

        if (from > groupIndex) {
            groupIndex = Math.round(currentScrollLeft / this.groupWidth);
        }
        if (currentScrollLeft < this.groupWidth && currentScrollLeft === this.groupWidth || currentScrollLeft === 0) {
            this.btnLeft.fadeOut(300, 0);
        } else {
            this.btnLeft.fadeTo(300, 1);
        }
        if (this.maxScrollWidth - currentScrollLeft <= this.sliderWidth) {
            this.btnRight.fadeOut(300, 0);
        } else {
            this.btnRight.fadeTo(300, 1);
        }
        if (this.indicators) {
            if (this.maxScrollWidth - currentScrollLeft <= this.sliderWidth) {
                groupIndex = this.indicators.children().length - 1;
            }
            this.indicators.children().removeClass('active');
            $(this.indicators.children()[groupIndex]).addClass('active');
        }
    }

}


$(document).ready(() => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        $('.carousel-control-prev').css('visibility', 'hidden');
        $('.carousel-control-next').css('visibility', 'hidden');
        $('.slider-btn-left').css('visibility', 'hidden');
        $('.slider-btn-right').css('visibility', 'hidden');
    }

    $('#navSearchInputText').val('');

    let searched = false;
    let movieLatest = null, movieUpcoming = null, movieTopRated = null,
        tvLatest = null, tvTopRated = null;

    async function getApi(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }

    async function getTrailer(id, mediaType) {
        await getApi(`https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${API_KEY}&language=en-US`)
            .then(data => {
                let trailer = data.results.filter(x => x.name.toLowerCase().includes('official trailer'));
                if (trailer.length === 0 && data.results.length > 0) {
                    trailer = data.results;
                }
                if (data.results.length === 0) {
                    $('#noTrailer').toggleClass('hidden');
                    $('#trailerVideo').attr('src', '');
                } else {
                    $('#trailerVideo').attr('src', `https://www.youtube.com/embed/${trailer[trailer.length - 1].key}`);
                }
                $('.main').toggleClass('opacity-0');
                $('.carousel-trailer').parent().toggleClass('hidden');
                setTimeout(() => {
                    $('.main').toggleClass('hidden');
                    $('.carousel-trailer').toggleClass('opacity-0');
                }, 500);
            });
    }

    (async () => {
        const carousel = await getApi(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`)
            .then(data => {
                if (('ok' in data) && !data.ok) {
                    console.log(data.status);
                } else {
                    $('#carouselSpinner').hide();
                    let i = 0;
                    data.results.forEach(obj => {
                        if (i === 0) {
                            setUpNext(data.results[data.results.length - 2], data.results.length - 2);
                            setUpNext(data.results[data.results.length - 1], data.results.length - 1);
                        }
                        setCarousel(obj, i);
                        if (i < 18) {
                            setUpNext(obj, i);
                        }
                        carouselItems.push(obj);
                        i++;
                    });

                    const upNext = $('.featured-poster-up-next');

                    $('#carouselMovie').on("slid.bs.carousel", e => {
                        const firstChild = $('.featured-poster-up-next').children().first();
                        const lastChild = $('.featured-poster-up-next').children().last();

                        if (e.direction === 'left') {
                            firstChild.toggleClass('slide-up');
                            setTimeout(() => {
                                upNext.append(firstChild);
                                firstChild.toggleClass('slide-up');
                            }, 260);
                        } else {
                            lastChild.toggleClass('slide-up');
                            firstChild.before($('.featured-poster-up-next').children().last());
                            setTimeout(() => {
                                $('.featured-poster-up-next').children().first().toggleClass('slide-up');
                            }, 10);
                        }
                    });
                }
            });

        const movie = await getApi(API_MOVIE_NOW_PLAYING + 'page=1')
            .then(data => {
                if (('ok' in data) && !data.ok) {
                    console.log(data.status);
                } else {
                    $('#movieSpinner').hide();
                    let i = 0;
                    data.results.forEach(obj => {
                        setSlider(obj, $(SLIDER_MOVIE), i);
                        i++;
                    });
                    fade($(SLIDER_MOVIE));
                    movieItems = data.results;
                    movieLatest = data.results;
                    return data;
                }
            });

        const tv = await getApi(API_TV_TOP_RATED + 'page=1')
            .then(data => {
                if (('ok' in data) && !data.ok) {
                    console.log(data.status);
                } else {
                    $('#tvSpinner').hide();
                    i = 0;
                    data.results.forEach(obj => {
                        setSlider(obj, $(SLIDER_TV), i);
                        i++;
                    });
                    fade($(SLIDER_TV));
                    tvItems = data.results;
                    tvTopRated = data.results;
                    return data;
                }
            });

        Promise.allSettled([carousel, movie, tv])
            .then(() => {
                const sliderMovie = new Slider($(SLIDER_MOVIE));
                const sliderTv = new Slider($(SLIDER_TV));
                let sliderSearch, sliderMovieCast, sliderTvCast;

                sliderMovie.setIndicator($(SLIDER_MOVIE));
                sliderTv.setIndicator($(SLIDER_TV));

                setNavSliderWidth('#movieNav');
                setNavSliderWidth('#tvNav');

                $(SLIDER_MOVIE).scroll(e => {
                    clearTimeout($.data(this, "scrollCheck"));
                    $.data(this, "scrollCheck", setTimeout(function () {
                        sliderMovie.scrollPosition();

                    }, 200));
                });

                $(SLIDER_TV).scroll(e => {
                    clearTimeout($.data(this, "scrollCheck"));
                    $.data(this, "scrollCheck", setTimeout(function () {
                        sliderTv.scrollPosition();
                    }, 200));
                });

                $(document).on('click', e => {
                    if (e.target.closest(SEARCH_INPUT)) {
                        e.preventDefault();
                        if (!$(SEARCH_INPUT).hasClass('active')) {
                            clickSearch();
                        } else {
                            if (e.target.closest('#navSearch')) {
                                clickSearch();
                            }
                        }
                    }

                    if (!e.target.closest(SEARCH_INPUT)) {
                        if ($(SEARCH_INPUT).hasClass('active')) {
                            clickSearch();
                        }
                    }

                    if (e.target.closest('.search-item')) {
                        e.preventDefault();
                        const search = $(e.target.closest('.search-item'));
                        $('#navSearchInputText').val('');
                        $('#searchDetailsSpinner').show();

                        (async () => {
                            const id = search.data('id');
                            const mediaType = search.data('mediaType');
                            let aggregate = '';

                            $('.search-result').hide();
                            if (mediaType === 'tv') {
                                aggregate = 'aggregate_';
                            }

                            const details = await getApi(`https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&language=en-US`);
                            const credits = await getApi(`https://api.themoviedb.org/3/${mediaType}/${id}/${aggregate}credits?api_key=${API_KEY}&language=en-US`);
                            const trailer = await getApi(`https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${API_KEY}&language=en-US`);

                            Promise.allSettled([details, credits, trailer])
                                .then(() => {
                                    details.trailer = trailer.results[trailer.results.length - 1] || '';
                                    details.credits = credits;
                                    details.mediaType = 'movie';
                                    details.targetId = 'searchCast';

                                    setDetails(details, $('#searchDetails>.details-content'));

                                    if (searched === false) {
                                        $('#searchDetails').toggleClass('show-details');
                                    }

                                    $('#searchDetailsSpinner').hide();
                                    clickSearch();
                                    sliderSearch = new Slider($('#searchDetails #sliderCast'));
                                    setNavSliderWidth('#searchDetails');
                                    searched = true;

                                    $('#searchDetails .slider').scroll(e => {
                                        clearTimeout($.data(this, "scrollCheck"));
                                        $.data(this, "scrollCheck", setTimeout(function () {
                                            sliderSearch.scrollPosition();
                                        }, 200));
                                    });
                                });
                        })();
                    }

                    if (e.target.closest('.carousel-link')) {
                        e.preventDefault();
                        const index = $(e.target.closest('.carousel-link')).data('index');
                        getTrailer(carouselItems[index].id, carouselItems[index].media_type);
                    }

                    if (e.target.closest('#closeTrailer')) {
                        e.preventDefault();
                        $('.carousel-trailer').toggleClass('opacity-0');
                        if (!$('#noTrailer').hasClass('hidden')) {
                            $('#noTrailer').toggleClass('hidden');
                        }
                        setTimeout(() => {
                            $('.main').toggleClass('hidden');
                            setTimeout(() => {
                                $('.carousel-trailer').parent().toggleClass('hidden');
                                $('#trailerVideo').attr('src', '');
                                $('.main').toggleClass('opacity-0');
                            }, 100);
                        }, 500);
                    }

                    if (e.target.closest('.slider-indicator')) {
                        const indicatorIndex = $(e.target.closest('.slider-indicator-index')).data('indicatorIndex');
                        const slider = $(e.target.closest('.slider-indicator-index')).data('target');
                        let groupWidth;

                        if (slider === SLIDER_MOVIE) {
                            groupWidth = sliderMovie.groupWidth;
                        } else {
                            groupWidth = sliderTv.groupWidth;
                        }

                        $(slider).scrollLeft(groupWidth * indicatorIndex);
                    }

                    if (e.target.closest('.slider-item')) {
                        const sliderItem = $(e.target.closest('.slider-item'));
                        const parentId = sliderItem.parent().attr('id');

                        if (parentId === 'sliderMovie') {
                            const id = movieItems[sliderItem.data('index')].id;

                            if (!sliderItem.hasClass('active')) {
                                spinner(sliderItem);

                                (async () => {
                                    const movieDetails = await getApi(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=en-US`);
                                    const movieCredits = await getApi(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}&language=en-US`);
                                    const movieTrailer = await getApi(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}&language=en-US`);

                                    Promise.allSettled([movieDetails, movieCredits, movieTrailer])
                                        .then(() => {
                                            movieDetails.trailer = movieTrailer.results[movieTrailer.results.length - 1];
                                            movieDetails.credits = movieCredits;
                                            movieDetails.mediaType = 'movie';
                                            movieDetails.targetId = 'movieCast';

                                            setDetails(movieDetails, $('#movieDetails>.details-content'));

                                            spinner(sliderItem);

                                            if ($('#sliderMovie .slider-item').siblings().hasClass('active')) {
                                                $('#sliderMovie .slider-item').removeClass('active');
                                            } else {
                                                $('#movieDetails').toggleClass('show-details');
                                            }

                                            sliderMovieCast = new Slider($('#movieDetails #sliderCast'));
                                            setNavSliderWidth('#movieDetails');
                                            setTimeout(() => {
                                                $(document).scrollTop($('#movieDetails').offset().top);
                                            }, 500);
                                            sliderItem.addClass('active');

                                            $('#movieDetails .slider').scroll(e => {
                                                clearTimeout($.data(this, "scrollCheck"));
                                                $.data(this, "scrollCheck", setTimeout(function () {
                                                    sliderMovieCast.scrollPosition();
                                                }, 200));
                                            });
                                        });
                                })();
                            } else {
                                sliderItem.removeClass('active');
                                $('#movieDetails #closeDetails').click();
                            }
                        } else {
                            const id = tvItems[sliderItem.data('index')].id;

                            if (!sliderItem.hasClass('active')) {
                                spinner(sliderItem);

                                (async () => {
                                    const tvDetails = await getApi(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=en-US`);
                                    const tvCredits = await getApi(`https://api.themoviedb.org/3/tv/${id}/aggregate_credits?api_key=${API_KEY}&language=en-US`);
                                    const tvTrailer = await getApi(`https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}&language=en-US`);

                                    Promise.allSettled([tvDetails, tvCredits, tvTrailer])
                                        .then(() => {
                                            tvDetails.trailer = tvTrailer.results[tvTrailer.results.length - 1] || "";
                                            tvDetails.credits = tvCredits;
                                            tvDetails.mediaType = 'tv';
                                            tvDetails.targetId = 'tvCast';

                                            setDetails(tvDetails, $('#tvDetails>.details-content'));

                                            spinner(sliderItem);

                                            if ($('#sliderTv .slider-item').siblings().hasClass('active')) {
                                                $('#sliderTv .slider-item').removeClass('active');
                                            } else {
                                                $('#tvDetails').toggleClass('show-details');
                                            }

                                            sliderTvCast = new Slider($('#tvDetails #sliderCast'));
                                            setNavSliderWidth('#tvDetails');
                                            setTimeout(() => {
                                                $(document).scrollTop($('#tvDetails').offset().top);
                                            }, 500);
                                            sliderItem.addClass('active');

                                            $('#tvDetails .slider').scroll(e => {
                                                clearTimeout($.data(this, "scrollCheck"));
                                                $.data(this, "scrollCheck", setTimeout(function () {
                                                    sliderTvCast.scrollPosition();
                                                }, 200));
                                            });
                                        });
                                })();
                            } else {
                                sliderItem.removeClass('active');
                                $('#tvDetails #closeDetails').click();
                            }
                        }
                    }

                    if (e.target.closest('#closeDetails')) {
                        const detail = $(e.target.closest('#closeDetails')).parent().parent().parent().parent().attr('id');
                        if (detail === 'searchDetails') {
                            searched = false;
                        } else {
                            let slider;

                            if (detail === 'movieDetails') {
                                slider = 'sliderMovie';
                            } else {
                                slider = 'sliderTv';
                            }

                            $(`#${slider}>.slider-item`).removeClass('active');
                        }

                        $(`#${detail}`).toggleClass('show-details');
                    }

                    if (e.target.closest('.nav-slider-btn')) {
                        const navSlider = $(e.target.closest('.nav-slider-btn'));
                        const parent = navSlider.parent();
                        const navOffset = $(navSlider).offset().left - $(e.target).parent().offset().left;
                        const navWidth = $(navSlider).css('width');
                        const index = parseInt(navSlider.data('index'));
                        const from = parent.children('.nav-slider-active').data('index');
                        let parentId = $(navSlider).parent().attr('id');
                        let i = 0;

                        parent.children('.nav-slider-btn').removeClass('nav-slider-active');
                        $(navSlider).addClass('nav-slider-active');
                        navSlider.siblings('.nav-slider-slider').css({ 'width': navWidth, 'transform': `translateX(${navOffset}px)` });

                        if (parentId === 'movieNav') {
                            $(SLIDER_MOVIE).children().toggleClass('fade');
                            setTimeout(() => {
                                $(SLIDER_MOVIE).children().remove();
                            }, 500);

                            if ($('#movieDetails').css('opacity') == 1) {
                                $('#movieDetails #closeDetails').click();
                            }

                            movieItems = [];
                            setTimeout(() => {
                                if (index === 0) {
                                    i = 0;

                                    movieLatest.forEach(obj => {
                                        setSlider(obj, $(SLIDER_MOVIE), i);
                                        i++;
                                    });

                                    movieItems = movieLatest;
                                    fade($(SLIDER_MOVIE));
                                } else if (index === 1) {
                                    if (movieTopRated == null) {
                                        (async () => {
                                            await getApi(API_MOVIE_TOP_RATED + 'page=1')
                                                .then(data => {
                                                    i = 0;

                                                    data.results.forEach(obj => {
                                                        setSlider(obj, $(SLIDER_MOVIE), i);
                                                        i++;
                                                    });

                                                    fade($(SLIDER_MOVIE));
                                                    movieItems = data.results;
                                                    movieTopRated = data.results;
                                                });
                                        })();
                                    } else {
                                        i = 0;

                                        movieTopRated.forEach(obj => {
                                            movieItems.push(obj);
                                            setSlider(obj, $(SLIDER_MOVIE), i);
                                            i++;
                                        });

                                        fade($(SLIDER_MOVIE));
                                        movieItems = movieTopRated;
                                    }
                                } else if (index === 2) {
                                    if (movieUpcoming != null) {
                                        i = 0;

                                        movieUpcoming.forEach(obj => {
                                            setSlider(obj, $(SLIDER_MOVIE), i);
                                            i++;
                                        });

                                        fade($(SLIDER_MOVIE));
                                        movieItems = movieUpcoming;
                                    } else {
                                        (async () => {
                                            await getApi(API_MOVIE_UPCOMING + 'page=1')
                                                .then(data => {
                                                    i = 0;

                                                    data.results.forEach(obj => {
                                                        setSlider(obj, $(SLIDER_MOVIE), i);
                                                        i++;
                                                    });

                                                    fade($(SLIDER_MOVIE));
                                                    movieItems = data.results;
                                                    movieUpcoming = data.results;
                                                });
                                        })();
                                    }
                                }
                            }, FADE_DELAY);
                        }
                        else if (parentId === 'tvNav') {
                            $(SLIDER_TV).children().toggleClass('fade');
                            setTimeout(() => {
                                $(SLIDER_TV).children().remove();
                            }, 500);

                            if ($('#tvDetails').css('opacity') == 1) {
                                $('#tvDetails #closeDetails').click();
                            }

                            tvItems = [];

                            setTimeout(() => {
                                if (index === 0) {
                                    i = 0;
                                    tvTopRated.forEach(obj => {
                                        setSlider(obj, $(SLIDER_TV), i);
                                        i++;
                                    });
                                    fade($(SLIDER_TV));
                                    tvItems = tvTopRated;
                                } else if (index === 1) {
                                    if (tvLatest == null) {
                                        (async () => {
                                            await getApi(API_TV_AIRING_TODAY + 'page=1')
                                                .then(data => {
                                                    let i = 0;
                                                    data.results.forEach(obj => {
                                                        setSlider(obj, $(SLIDER_TV), i);
                                                        i++;
                                                    });
                                                    fade($(SLIDER_TV));
                                                    tvItems = data.results;
                                                    tvLatest = data.results;
                                                });
                                        })();
                                    } else {
                                        i = 0;
                                        tvLatest.forEach(obj => {
                                            setSlider(obj, $(SLIDER_TV), i);
                                            i++;
                                        });
                                        fade($(SLIDER_TV));
                                        tvItems = tvLatest;
                                    }
                                }
                            }, FADE_DELAY);
                        } else {
                            const detailParentId = $(navSlider).parent().parent().parent().parent().attr('id');
                            parentId = detailParentId;

                            if (from != index) {
                                let x = 0;
                                if (from < index) {
                                    x = (from - index) * 100 * index;
                                    if (from === 0 && index === 2) {
                                        x = x + 200;
                                    }
                                } else {
                                    x = (index - from) * 100 * index;
                                }

                                const detailsWrapper = $(`#${detailParentId} .details-sub-wrapper`);
                                detailsWrapper.css('transform', `translateX(${x}%)`);
                            }
                        }
                    }

                    if (e.target.closest('.slider-btn-left')) {
                        let slider = $(e.target.closest('.slider-btn-left')).data('target');

                        if (slider === SLIDER_MOVIE) {
                            sliderMovie.scrollTo(-1);
                        } else if (slider === SLIDER_TV) {
                            sliderTv.scrollTo(-1);
                        } else if (slider === '#searchCast') {
                            sliderSearch.scrollTo(-1);
                        } else if (slider === '#movieCast') {
                            sliderMovieCast.scrollTo(-1);
                        } else if (slider === '#tvCast') {
                            sliderTvCast.scrollTo(-1);
                        }
                    }

                    if (e.target.closest('.slider-btn-right')) {
                        let slider = $(e.target.closest('.slider-btn-right')).data('target');

                        if (slider === SLIDER_MOVIE) {
                            sliderMovie.scrollTo(1);
                        } else if (slider === SLIDER_TV) {
                            sliderTv.scrollTo(1);
                        } else if (slider === '#searchCast') {
                            sliderSearch.scrollTo(1);
                        } else if (slider === '#movieCast') {
                            sliderMovieCast.scrollTo(1);
                        } else if (slider === '#tvCast') {
                            sliderTvCast.scrollTo(1);
                        }
                    }

                    if (e.target.closest('.go-to-top')) {
                        e.preventDefault();
                        $(document).scrollTop(0);
                    }

                    if (!e.target.closest('.search-item') && $('.search-result').is(':visible')
                        && !e.target.closest('#navSearchInputText')) {
                        $('.search-result').hide();
                    }
                });
            });

    })();

    // Scroll to first item on load
    $('.slider').scrollLeft(0);

    $('#navSearchInputText').on('keyup focus', () => {
        const result = $('.search-result');
        const search = $('#navSearchInputText');
        const text = search.val();

        if (text !== '') {
            let mediaType = $('#navSearchSelect').val();
            let searchUrl = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${API_KEY}&query=${text}`;

            (async () => {
                await getApi(searchUrl)
                    .then(data => {
                        if (data.total_results > 0) {
                            result.html(' ');
                            data.results.forEach(obj => {
                                result.css('opacity', 1);
                                let fetch = result.html();
                                result.html(fetch + `<a href="#">
                                            <div class="search-item" data-id="${obj.id}" data-media-type="${mediaType}">
                                                ${obj.title || obj.name}
                                            </div>
                                        </a>`);
                            });
                            result.show().animate({ height: 'min-content' }, 1000);
                        } else {
                            result.html('');
                            result.css('opacity', 0);
                        }
                    });
            })();
        } else {
            result.html('');
            result.css('opacity', 0);
        }
    });
});

function clickSearch() {
    let delay = 250;
    if ($('#navSearchIcon').hasClass('bi-search')) {
        $('#navSearchIcon')
            .removeClass('bi-search')
            .addClass('bi-x-lg');
        setTimeout(() => {
            $('#navSearchInputText').focus()
        }, 100);
    } else {
        $('#navSearchIcon')
            .removeClass('bi-x-lg')
            .addClass('bi-search');
        $('.search-result').hide();
        $('#navSearchInputText').val('');
        delay = 0;
    }
    setTimeout(() => {
        $('#navSearchSelect').toggleClass('block');
    }, delay);
    $(SEARCH_INPUT).toggleClass('active');
}

function fade(element) {
    setTimeout(() => {
        element.children().toggleClass('fade');
    }, 50);
}

// Insert trailers in carousel
function setCarousel(data, i) {
    const carousel = $('.carousel-inner').html();
    let is_active;
    if (i === 0) {
        is_active = 'active';
    }
    let mediaType = '<i class="bi bi-film"></i>';
    if (data.media_type === 'tv') {
        mediaType = '<i class="bi bi-tv"></i>';
    }
    $('.carousel-inner').html(carousel + `<div class="carousel-item ${is_active}">
        <img loading="lazy" src="${BASE_URL_IMG_ORIGINAL}${data.backdrop_path}" class="d-block w-100 carousel-img" alt="...">
        <div class="carousel-caption">
            <a class="carousel-link" href="#" data-index="${i}">
                <div class="d-flex">
                    <i class="bi bi-play-circle-fill ms-2 play"></i>
                    <div class="caption-content">
                        <h3>${data.title || data.name}</h3>
                        <p>
                            <i class="bi bi-star-fill star"></i>
                            ${data.vote_average.toFixed(1)}
                        </p>
                    </div>
                    <h2 class="ms-auto">${mediaType}</h2>
                </div>
            </a>
        </div>
    </div>`);
}
function setUpNext(data, i) {
    const poster = $('.featured-poster-up-next').html();
    $('.featured-poster-up-next').html(poster + `<div class="featured-poster-up-next-content">
        <a class="carousel-link" href="#" data-index="${i}">
            <img src="${BASE_URL_IMG_W500}${data.poster_path}" class="" alt="${data.title || data.name}">
            <i class="bi bi-play-circle-fill ms-2 play"></i>
                <div class="up-next-caption">
                <h5>${data.title || data.name}</h5>
                <p><i class="bi bi-star-fill me-2 star"></i>${data.vote_average.toFixed(1)}</p>
            </div>
        </a>
    </div>`);
}

function setSlider(data, element, index) {
    const fetchSlider = element.html();

    element.html(fetchSlider + `<div class="slider-item fade" data-index="${index}">
        <img src="${BASE_URL_IMG_W500}${data.poster_path}" alt="${data.title || data.name}">
        <div class="slider-item-details">
            <h6>${data.title || data.name}</h6>
            <p><i class="bi bi-star-fill me-1 star"></i>${data.vote_average}</p>
        </div>
    </div>`);
}

function setDetails(data, element) {
    element.parent().css('background', `url(https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${data.backdrop_path}) no-repeat 50% 50%`);
    let genres = [];

    data.genres.forEach(obj => {
        genres.push(obj.name);
    });

    const directorArr = data.credits.crew.filter(x => x.department.toLowerCase() === 'directing');
    const writerArr = data.credits.crew.filter(x => x.department.toLowerCase() === 'writing');

    let duplicates = [];
    let newWriterArr = [];
    let backupWriterArr = [];
    let i = 0;

    writerArr.forEach(obj => {
        const job = obj.job || obj.jobs[0].job;
        if (obj.department.toLowerCase() === 'writing') {
            if (job.toLowerCase() === 'screenplay' || job.toLowerCase() === 'story' || job.toLowerCase() === 'writer') {
                if (newWriterArr.find(x => x.name === obj.name)) {
                    const index = newWriterArr.findIndex(x => x.name === obj.name);
                    newWriterArr[index].job += ', ' + job;
                    duplicates.push(i);
                } else {
                    newWriterArr.push(obj);
                }
            } else {
                backupWriterArr.push(obj);
            }
            i++;
        }
    });

    let directors = '';
    let directorCount = 0;

    directorArr.forEach(obj => {
        const job = obj.job || obj.jobs[0].job;
        if (job.toLowerCase() === 'director' || job.toLowerCase() === 'co-director') {
            if (directors.length > 0) {
                directors += ', ';
            }
            directors += obj.name;
            if (job.toLowerCase() !== 'director') {
                directors += ' (' + job + ')';
            }
            directorCount++;
        }
    });

    let writers = '';
    let writerCount = 0;

    newWriterArr.forEach(obj => {
        const job = obj.job || obj.jobs[0].job;

        if (writers.length > 0) {
            writers += ', '
        }
        writers += obj.name;

        if (job.toLowerCase() !== 'writer') {
            writers += ' (' + job + ')';
        }
        writerCount++;
    });

    if (newWriterArr.length === 0) {
        writerCount = 0;
        backupWriterArr.forEach(obj => {
            const job = obj.job || obj.jobs[0].job;

            if (writers.length > 0) {
                writers += ', '
            }
            writers += obj.name;

            if (job.toLowerCase() !== 'writer') {
                writers += ' (' + job + ')';
            }
            writerCount++;
        });
    }
    if (directors.length <= 7) {
        directors = '';
    } else {
        if (directorCount === 1) {
            directors = '<b>Director</b><span class="people">' + directors + '</span>';
        } else if (directorCount > 1) {
            directors = '<b>Directors</b><span class="people">' + directors + '</span>';
        }
        directors = '<p class="d-flex">' + directors + '</p>';
    }
    if (writers.length <= 7) {
        writers = '';
    } else {
        if (writerCount === 1) {
            writers = '<b>Writer</b><span class="people">' + writers + '</span>';
        } else if (writerCount > 1) {
            writers = '<b>Writers</b><span class="people">' + writers + '</span>';
        }
        writers = '<p class="d-flex">' + writers + '</p>';
    }

    let creators = '';
    let creatorCount = 0;
    let productions = '';
    if (data.mediaType === 'movie') {
        let companyName = [];

        data.production_companies.forEach(obj => {
            companyName.push(obj.name);
        });

        productions = `<p class="d-flex"><b>Production</b><span class="people">${companyName.join(", ")}<span></p>`;
    } else {
        data.created_by.forEach(obj => {

            if (creators.length > 0) {
                creators += ', '
            }
            creators += obj.name;
            creatorCount++;
        });
        if (creatorCount === 1) {
            creators = '<b>Creator</b><span class="people">' + creators + '</span>';
        } else if (creatorCount > 1) {
            creators = '<b>Creators</b><span class="people">' + creators + '</span>';
        }
        creators = '<p class="d-flex">' + creators + '</p>';
        directors = '';
        writers = '';
    }

    const date = data.release_date || data.first_air_date;
    const year = new Date(date).getFullYear();

    element.html(`<div class="details-contents">
        <div class="close-details">
            <button type="button" class="btn btn-lg ms-auto text-white" id="closeDetails">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="nav-slider" id="details-nav-slider">
            <button type="button" class="nav-slider-btn nav-slider-active" data-index="0">Details</button>
            <button type="button" class="nav-slider-btn" data-index="1">Casts</button>
            <button type="button" class="nav-slider-btn" data-index="2">Trailer</button>
            <span class="nav-slider-slider"></span>
        </div>
        <div class="details-wrapper">
            <div class="details-sub-wrapper">
                <div class="details-detail">
                    <img class="detail-poster" src="${BASE_URL_IMG_W500}${data.poster_path}" alt="" id="movieDetailsPoster">
                    <div class="details-text">
                        <h3><b>${data.title || data.name}</b></h3>
                        <p class="wrap">
                            <i class="bi bi-star-fill me-2 star"></i>
                            <span class="me-2">${data.vote_average.toFixed(1)} / 10</span>|
                            <span class="ms-2 me-2">(${year})</span>
                            </p>
                        <p><i>${genres.join(" &bull; ")}</i></p>
                        <div class="overview"><p>${data.overview || 'There is no overview available.'}</p></div>
                        ${creators}
                        ${directors}
                        ${writers}
                        ${productions}
                    </div>
                </div>
                <div class="details-cast">
                    <div class="media-slider" id="${data.targetId}">
                        <button type="button" class="btn btn-lg btn-dark slider-btn-left hidden" id="slider-cast-btn-left"
                            data-target="#${data.targetId}">
                            <div class="chevron"><i class="bi bi-chevron-left"></i></div>
                        </button>
                        <button type="button" class="btn btn-lg btn-dark slider-btn-right" id="slider-cast-btn-right"
                            data-target="#${data.targetId}">
                            <div class="chevron"><i class="bi bi-chevron-right "></i></div>
                        </button>
                        <div class="slider snaps-inline" id="sliderCast"></div>
                    </div>
                </div>
                <div class="details-trailer">
                    <iframe class="trailer" src="https://www.youtube.com/embed/${data.trailer.key}" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    </div>`);

    data.credits.cast.forEach(obj => {
        const slider = element.find('.slider');
        let profile, character;
        if (obj.profile_path) {
            profile = BASE_URL_IMG_W500 + obj.profile_path;
        } else {
            if (obj.gender === 1) {
                profile = 'img/blank-profile-female.jpg';
            } else {
                profile = 'img/blank-profile-male.jpg';
            }
        }
        if (data.mediaType === 'movie') {
            character = obj.character;
        } else {
            character = obj.roles[0].character;
        }
        slider.html(slider.html() + `<div class="slider-item">
            <img src="${profile}" alt="${obj.title || obj.name}">
            <div class="slider-cast-item-details">
                <h6>${obj.name}</h6>
                <p>${character}</p>
            </div>
        </div>`);
    });
}

function showMore() {
    $('.production-company').toggleClass('show-more');
    $('#companyShowMore').toggleClass('active');
    if ($('#companyShowMore').hasClass('active')) {
        $('#companyShowMore').text('Show less');
        $('.production-company>p').append($('#companyShowMore'));
    } else {
        $('#companyShowMore').text('Show more');
        $('.production-company').append($('#companyShowMore'));
    }
    return false;
}

function setNavSliderWidth(parentElement) {
    const firstNavWidth = $(`${parentElement} .nav-slider-slider`).siblings().first().innerWidth();
    $(`${parentElement} .nav-slider-slider`).css('width', firstNavWidth);
}

function spinner(element) {
    const spinner = `<div class="spinner-center">
        <div class="arc-reactor-spinner">
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="outer"></div>
            <div class="center"></div>
        </div >
    </div > `;

    if (element.children('.spinner-center').length === 0) {
        element.append(spinner);
    } else {
        element.children('.spinner-center').remove();
    }
}