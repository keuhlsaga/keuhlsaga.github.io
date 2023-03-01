const API_KEY = '68600ee078a7e72d5abc22065b49b33a';
// Image base url
const BASE_URL_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const BASE_URL_IMG_W500 = 'https://image.tmdb.org/t/p/w500/';

const SLIDER_GROUP = '.slider-group';
const SELECTOR_ITEM = '.slider-group-item';
const SLIDER_MOVIE = '#sliderMovie';
const SLIDER_TV = '#sliderTv';
const SLIDER_ITEM_PER_GROUP = 7;
const SLIDER_PADDING = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--slider-gap').replace('rem', '') * 16 * 2);
const SLIDER_ITEM_WIDTH = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--slider-img-width').replace('rem', '') * 16);

class Slider {
    constructor(element) {
        this.element = element;
        this.sliderWidth = element.offsetWidth;
        this.maxScrollWidth = element.scrollWidth;
        // this.itemPerGroup = itemPerGroup;
        this.itemPerGroup = Math.floor(this.sliderWidth / element.firstElementChild.offsetWidth);
        this.groupWidth = element.firstElementChild.offsetWidth * this.itemPerGroup + SLIDER_PADDING;
        this.lastGroupItemCount = element.children.length - Math.floor((element.children.length / this.itemPerGroup) * this.itemPerGroup);
        this.lastGroupWidth = element.lastElementChild.offsetWidth * this.lastGroupItemCount + SLIDER_PADDING;
        this.sliderIndicator = this.element.parentElement.parentElement.firstElementChild;

        this.btnLeft = element.parentElement.children[1];
        this.btnRight = element.parentElement.children[2];
    }

    scrollTo(direction) {
        const groupWidth = this.element.firstElementChild.offsetWidth * (this.itemPerGroup) + SLIDER_PADDING;
        const lastGroupItemCount = this.element.children.length - Math.floor((this.element.children.length / this.itemPerGroup) * this.itemPerGroup);
        const lastGroupWidth = this.element.lastElementChild.offsetWidth * (this.lastGroupItemCount) + SLIDER_PADDING;
        const sliderIndicator = this.element.parentElement.parentElement.firstElementChild;

        let scrolledLeft = this.element.scrollLeft;
        let equation = scrolledLeft / (this.groupWidth - 1);
        // let equation = scrolledLeft / (groupWidth - 1);
        let currentGroup = Math.round(equation) + 1;

        // Slider scrolled at the end
        if (Math.floor(equation) !== Math.round(equation) && SLIDER_ITEM_PER_GROUP % 2 === 0 && equation - Math.floor(equation) !== 0) {
            console.log('what?');
            currentGroup--;
        }

        // console.log(Math.round(equation));
        // console.log(equation);
        // console.log(Math.floor(equation) !== Math.round(equation));
        // console.log(SLIDER_ITEM_PER_GROUP % 2 === 0);
        // console.log(Math.round(equation) == currentGroup);
        // console.log(this.maxScrollWidth - scrolledLeft - this.groupWidth < this.sliderWidth);
        // console.log('item count ', this.element.children.length);
        // console.log('groups ', this.lastGroupItemCount);
        // console.log('group number ', currentGroup);
        // console.log('current position ', scrolledLeft);
        // console.log('max scroll : ', this.maxScrollWidth);
        // console.log('scroll remaining ', this.maxScrollWidth - scrolledLeft);
        // console.log('slider item per group ', SLIDER_ITEM_PER_GROUP);
        // console.log('slider group width ', this.groupWidth);
        // console.log('slider last group width ', this.lastGroupWidth);
        // console.log('slider width ', this.sliderWidth);
        // console.log(this.maxScrollWidth - scrolledLeft, this.sliderWidth);
        // console.log(this.lastGroupWidth, this.groupWidth);
        // console.log('to left ', (currentGroup - 2) * this.groupWidth);
        // console.log('to right ', currentGroup * this.groupWidth);
        // console.log(this.lastGroupWidth, this.groupWidth);

        // FIX!
        if (direction === -1) {
            // this.element.scrollLeft = (currentGroup - 2) * groupWidth;
            this.element.scrollLeft = (currentGroup - 2) * this.groupWidth;
        }
        if (direction === 1) {
            // this.element.scrollLeft = currentGroup * groupWidth;
            console.log(this.element);
            this.element.scrollLeft = currentGroup * this.groupWidth;
            console.log('before ', this.element.scrollLeft);
            // console.log('after ', currentGroup * groupWidth);
            console.log('after ', currentGroup * this.groupWidth);
        }

    }
}

$(document).ready(() => {
    $('#navSearchInputText').val('');

    // const discover = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate`;
    const discover = `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`;
    const movieNowPlaying = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;
    const tvAiringToday = `https://api.themoviedb.org/3/tv/airing_today?api_key=${API_KEY}&language=en-US&page=1`;
    let searched = false;
    let movieUpcoming, movieTopRated, tvLatest, tvUpcoming;

    async function getApi(url) {
        const response = await fetch(url)
            .then(response => {
                if (!response.ok) {
                    console.log('error');
                    return response;
                }
                return response.json();
            })
            .catch(err => {
                console.log(err);
            });
        // const data = await response.json();
        return response;
    }

    (async () => {
        // Carousel
        const carousel = await getApi(discover)
            .then(data => {
                if (('ok' in data) && !data.ok) {
                    console.log(data.status);
                } else {
                    // console.log(data);
                    $('#carouselSpinner').hide();
                    let i = 0;
                    data.results.forEach(json => {
                        setCarousel(json, i);
                        if (i !== 0) {
                            setUpNext(json);
                        }
                        i++;
                    });
                    for (i = 0; i < 3; i++) {
                        setUpNext(data.results[i]);
                    }


                    // Check if autoplay is active
                    if (!$('#autoplay').is(':checked')) {
                        $('#carouselMovie').carousel('pause');
                        $('#autoplay').removeClass('auto');
                    }

                    // Carousel autoplay
                    $('#autoplay').on('click', () => {
                        if ($('#autoplay').hasClass('auto')) {
                            $('#carouselMovie').carousel('pause');
                            $('#autoplay').removeClass('auto');
                        } else {
                            $('#carouselMovie').carousel('cycle');
                            $('#autoplay').addClass('auto');
                        }
                    });

                    // Height of one content in upNext div
                    let upNext = $('.featured-poster-up-next'),
                        upNextContentHeight = $('.featured-poster-up-next').children().innerHeight();

                    // Carousel slide listener
                    $('#carouselMovie').on("slid.bs.carousel", e => {
                        if (e.direction === 'left') {
                            if (Math.ceil(upNext.scrollTop() + upNext.innerHeight()) >= upNext.prop('scrollHeight')) {
                                upNext.scrollTop(0);
                            } else {
                                let scrollTop = Math.round(upNext.scrollTop() + upNextContentHeight),
                                    scrollNext = upNext.scrollTop() + upNextContentHeight;
                                if (Math.round(scrollNext) === Math.floor(scrollNext)) {
                                    scrollTop = scrollNext;
                                }
                                upNext.scrollTop(scrollTop);

                                // upNext.scrollTop(upNext.scrollTop() + upNextContentHeight);
                            }
                        } else {
                            if (upNext.scrollTop() == 0) {
                                upNext.scrollTop(upNext.prop('scrollHeight') - upNext.innerHeight());
                            } else {
                                let scrollTop = Math.round(upNext.scrollTop() - upNextContentHeight),
                                    scrollPrev = upNext.scrollTop() - upNextContentHeight;
                                if (Math.round(scrollPrev) === Math.floor(scrollPrev)) {
                                    scrollTop = scrollPrev;
                                }
                                upNext.scrollTop(scrollTop);

                                // upNext.scrollTop(upNext.scrollTop() - upNextContentHeight);
                            }
                        }
                    });
                }
            });

        // Movie slider
        const movie = await getApi(movieNowPlaying)
            .then(data => {
                if (('ok' in data) && !data.ok) {
                    console.log(data.status);
                } else {
                    $('#movieSpinner').hide();
                    let i = 0;
                    data.results.forEach(json => {
                        setSlider(json, $(SLIDER_MOVIE));
                        i++;
                    });
                }
                return data;
            });

        // TV slider
        const tv = await getApi(tvAiringToday)
            .then(data => {
                if (('ok' in data) && !data.ok) {
                    console.log(data.status);
                } else {
                    $('#tvSpinner').hide();
                    let i = 0;
                    data.results.forEach(json => {
                        setSlider(json, $(SLIDER_TV));
                        i++;
                    });
                }
                return data;
            });

        Promise.allSettled([carousel, movie, tv])
            .then(res => {
                const sliderMovie = new Slider(document.querySelector('#sliderMovie'));
                const sliderTv = new Slider(document.querySelector('#sliderTv'));
                let sliderSearch, sliderCast, sliderTvDetailsCast;

                // Set first nav-slider-slider to first nav width
                // Movie
                setNavSliderWidth('#movieNav');
                // Tv
                setNavSliderWidth('#tvNav');

                $(document).on('click', e => {
                    // Search item
                    if (e.target.closest('.search-item')) {

                        // $('#searchDetails').css('background', 'none');
                        $('#searchDetails').parent().show();
                        if (searched === false) {
                        }
                        $('#searchDetailsSpinner').show();
                        (async () => {
                            const id = e.target.dataset.id;
                            const type = e.target.dataset.type;
                            let aggregate = '';
                            $('.search-result').hide();
                            if (type === 'tv') {
                                aggregate = 'aggregate_';
                            }
                            console.log(id, type);
                            const details = await getApi(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US`);
                            const credits = await getApi(`https://api.themoviedb.org/3/${type}/${id}/${aggregate}credits?api_key=${API_KEY}&language=en-US`);
                            const trailer = await getApi(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}&language=en-US`);

                            Promise.allSettled([details, credits, trailer])
                                .then(() => {
                                    details.trailer = trailer.results[trailer.results.length - 1];

                                    setCast(details, $('#searchDetails>.details-content'));
                                    credits.cast.forEach(obj => {
                                        obj.type = type;
                                        setSliderCast(obj, $('#searchDetails #sliderCast'));
                                    });
                                    // $('#searchDetails .details-detail').show();
                                    // $('#searchDetails .details-trailer').hide();
                                    // $('#searchDetails .details-cast').hide();
                                    if (searched === false) {
                                        $('#searchDetails').toggleClass('show-details');
                                        $('#searchDetails>.details-content').show().animate({ height: '550px' }, 1000);
                                        $('#searchDetails>.details-content').toggleClass('show-details-content');
                                    }
                                    $('#searchDetailsSpinner').hide();
                                    sliderSearch = new Slider(document.querySelector('#searchDetails #sliderCast'));
                                    setNavSliderWidth('#searchDetails');
                                    searched = true;
                                });
                        })();
                        return false;
                    }

                    // Slider indicator click
                    if (e.target.closest('.slider-indicator')) {
                        let indicatorIndex = e.target.dataset.indicatorIndex;
                        let slider = e.target.dataset.target;
                        let groupWidth;
                        if (slider === SLIDER_MOVIE) {
                            groupWidth = sliderMovie.groupWidth;
                        } else {
                            groupWidth = sliderTv.groupWidth;
                        }
                        $(slider).scrollLeft(groupWidth * indicatorIndex);
                    }

                    // Slider item click
                    // PRIORITY-0
                    if (e.target.closest('.slider-item')) {
                        const parentId = e.target.closest('.slider-item').parentElement.id;
                        // console.log(e.target.closest('.slider-item').dataset.details);
                        // const details = e.target.closest('.slider-item').dataset.details;

                        const details = jQuery.parseJSON(e.target.closest('.slider-item').dataset.details.replace("'", "\\'"));
                        const id = details.id;
                        // console.log(details);
                        if (parentId === 'sliderMovie') {
                            // console.log($(e.target.closest('.slider-item')));
                            if (!$(e.target.closest('.slider-item')).hasClass('active')) {
                                $('#movieDetails').parent().show();
                                (async () => {
                                    const movieDetails = await getApi(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=en-US`);
                                    const movieCredits = await getApi(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}&language=en-US`);
                                    const movieTrailer = await getApi(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}&language=en-US`);

                                    Promise.allSettled([movieDetails, movieCredits, movieTrailer])
                                        .then(() => {
                                            movieDetails.trailer = movieTrailer.results[movieTrailer.results.length - 1];
                                            movieCredits.crew.forEach(obj => {
                                                if (obj.job.toLowerCase() === 'director') {
                                                    movieDetails.director = obj.name;
                                                }
                                                if (obj.known_for_department === 'Directing' || obj.known_for_department === 'Writing') {
                                                    // console.log(obj);
                                                }
                                            });
                                            setCast(movieDetails, $('#movieDetails>.details-content'));
                                            movieCredits.cast.forEach(obj => {
                                                obj.type = 'movie';
                                                setSliderCast(obj, $('#movieDetails #sliderCast'));
                                            });
                                            $('#movieDetailsSpinner').hide();
                                            // $('#movieDetails .details-detail').show();
                                            // $('#movieDetails .details-trailer').hide();
                                            // $('#movieDetails .details-cast').hide();

                                            if ($('#sliderMovie .slider-item').siblings().hasClass('active')) {
                                                $('#sliderMovie .slider-item').removeClass('active');
                                            } else {
                                                $('#movieDetails').toggleClass('show-details');
                                                $('#movieDetails>.details-content').show().animate({ height: '550px' }, 1000);
                                                $('#movieDetails>.details-content').toggleClass('show-details-content');
                                            }
                                            sliderCast = new Slider(document.querySelector('#movieDetails #sliderCast'));
                                            setNavSliderWidth('#movieDetails');
                                            $(document).scrollTop($('#movieDetails').offset().top - 25);
                                            e.target.closest('.slider-item').classList.add('active');


                                            // Movie Details Slider Cast
                                            $('#movieDetails .slider').scroll((e) => {
                                                clearTimeout($.data(this, "scrollCheck"));
                                                $.data(this, "scrollCheck", setTimeout(function () {
                                                    let currentScrollLeft = $('#movieDetails .slider').scrollLeft();
                                                    let group_index = Math.floor(currentScrollLeft / sliderCast.groupWidth) + 1;
                                                    // console.log('current position ', currentScrollLeft);
                                                    if (currentScrollLeft < sliderCast.groupWidth && currentScrollLeft === sliderCast.groupWidth || currentScrollLeft === 0) {
                                                        $('#movieDetails .slider-btn-left').fadeOut(350, 0);
                                                    } else {
                                                        $('#movieDetails .slider-btn-left').fadeTo(350, 1);
                                                    }

                                                    if (sliderCast.maxScrollWidth - currentScrollLeft <= sliderCast.sliderWidth) {
                                                        group_index++;
                                                        $('#movieDetails .slider-btn-right').fadeOut(350, 0);
                                                    } else {
                                                        $('#movieDetails .slider-btn-right').fadeTo(350, 1);
                                                    }
                                                }, 100));
                                            });
                                        });
                                })();
                            } else {
                                console.log('what');
                                $(e.target.closest('.slider-item')).removeClass('active');
                                $('#movieDetails #closeDetails').click();
                            }
                        } else {
                            // TV slider
                            if (!$(e.target.closest('.slider-item')).hasClass('active')) {
                                $('#tvDetailsSpinner').show();
                                (async () => {
                                    let isReady = [false, false, false];
                                    const tvDetails = await getApi(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=en-US`);
                                    const tvCredits = await getApi(`https://api.themoviedb.org/3/tv/${id}/aggregate_credits?api_key=${API_KEY}&language=en-US`);
                                    const tvTrailer = await getApi(`https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}&language=en-US`);

                                    Promise.allSettled([tvDetails, tvCredits, tvTrailer])
                                        .then(() => {
                                            tvDetails.trailer = tvTrailer.results[tvTrailer.results.length - 1] || "";

                                            setCast(tvDetails, $('#tvDetails>.details-content'));
                                            tvCredits.cast.forEach(obj => {
                                                obj.type = 'tv';
                                                setSliderCast(obj, $('#tvDetails #sliderCast'));
                                            });
                                            $('#tvDetails').parent().show();
                                            $('#tvDetailsSpinner').hide();
                                            // $('#tvDetails .details-detail').show();
                                            // $('#tvDetails .details-trailer').hide();
                                            // $('#tvDetails .details-cast').hide();

                                            if ($('#sliderTv .slider-item').siblings().hasClass('active')) {
                                                $('#sliderTv .slider-item').removeClass('active');
                                            } else {
                                                $('#tvDetails').toggleClass('show-details');
                                                $('#tvDetails>.details-content').show().animate({ height: '550px' }, 1000);
                                                $('#tvDetails>.details-content').toggleClass('show-details-content');
                                            }
                                            sliderTvDetailsCast = new Slider(document.querySelector('#tvDetails #sliderCast'));
                                            setNavSliderWidth('#tvDetails');
                                            $(document).scrollTop($('#tvDetails').offset().top);
                                            e.target.closest('.slider-item').classList.add('active');
                                        });
                                })();
                            } else {
                                $(e.target.closest('.slider-item')).removeClass('active');
                                $('#tvDetails #closeDetails').click();
                            }
                        }
                    }

                    // Details close button
                    if (e.target.closest('#closeDetails')) {
                        const detail = e.target.closest('#closeDetails').parentElement.parentElement.parentElement.parentElement.id;
                        // console.log(detail);
                        if (detail !== 'searchDetails') {
                            let slider;
                            if (detail === 'movieDetails') {
                                slider = 'sliderMovie';
                            } else {
                                slider = 'sliderTv';
                            }
                            $(`#${slider}>.slider-item`).removeClass('active');
                        }
                        $(`#${detail}>.details-content`).hide().animate({ height: '0' }, 5000);
                        $(`#${detail}>.details-content`).toggleClass('show-details-content');
                        $(`#${detail}`).toggleClass('show-details');
                        $(`#${detail}.details-trailer`).hide();
                        $(`#${detail}.details-trailer>.trailer-container`).hide();
                    }

                    // Nav slider
                    if (e.target.closest('.nav-slider-btn')) {
                        const navSlider = e.target.closest('.nav-slider-btn');
                        $('.nav-slider-btn').siblings().removeClass('nav-slider-active');
                        $(navSlider).addClass('nav-slider-active');
                        const navOffset = $(navSlider).offset().left - $(e.target).parent().offset().left;
                        const navWidth = $(navSlider).css('width');
                        const index = navSlider.dataset.index;
                        let parentId = $(navSlider).parent().attr('id');
                        console.log($(navSlider).parent().attr('id'));
                        $(`#${parentId} .nav-slider-slider`).css({ 'width': navWidth, 'transform': `translateX(${navOffset}px)` });
                        if (parentId === 'movieNav') {
                            if ($('#movieDetails').is(':visible')) {
                                console.log('ayaw og click!');
                                $('#movieDetails #closeDetails').click();
                            }
                            if (index === '0') {
                                $(SLIDER_MOVIE).children().remove();
                                movie.results.forEach(obj => {
                                    setSlider(obj, $(SLIDER_MOVIE));
                                });
                            } else if (index === '1') {
                                $(SLIDER_MOVIE).children().remove();
                                if (movieTopRated != null) {
                                    movieTopRated.results.forEach(obj => {
                                        setSlider(obj, $(SLIDER_MOVIE));
                                    });
                                } else {
                                    (async () => {
                                        const apiMovieTopRated = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`;
                                        movieTopRated = await getApi(apiMovieTopRated)
                                            .then(data => {
                                                // console.log(data);
                                                data.results.forEach(obj => {
                                                    // console.log(obj);
                                                    setSlider(obj, $(SLIDER_MOVIE));
                                                });
                                                return data;
                                            });
                                    })();
                                }
                            } else if (index === '2') {
                                $(SLIDER_MOVIE).children().remove();
                                if (movieUpcoming != null) {
                                    movieUpcoming.results.forEach(obj => {
                                        setSlider(obj, $(SLIDER_MOVIE));
                                    });
                                } else {
                                    (async () => {
                                        const apiMovieUpcoming = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`;
                                        movieUpcoming = await getApi(apiMovieUpcoming)
                                            .then(data => {
                                                // console.log(data);
                                                data.results.forEach(obj => {
                                                    // console.log(obj);
                                                    setSlider(obj, $(SLIDER_MOVIE));
                                                });
                                                return data;
                                            });
                                    })();
                                }
                            }
                        } else if (parentId === 'tvNav') {
                            if ($('#tvDetails').is(':visible')) {
                                $('#tvDetails #closeDetails').click();
                            }
                            if (index === '0') {
                                $(SLIDER_TV).children().remove();
                                tv.results.forEach(obj => {
                                    setSlider(obj, $(SLIDER_TV));
                                });
                            } else if (index === '1') {
                                $(SLIDER_TV).children().remove();
                                if (tvLatest != null) {
                                    tvLatest.results.forEach(obj => {
                                        setSlider(obj, $(SLIDER_TV));
                                    });
                                } else {
                                    (async () => {
                                        const apiTvLatest = `https://api.themoviedb.org/3/tv/latest?api_key=${API_KEY}&language=en-US`;
                                        const apiTvTopRated = `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=en-US&page=1`;
                                        tvLatest = await getApi(apiTvTopRated)
                                            .then(data => {
                                                // console.log('latest', data);
                                                data.results.forEach(obj => {
                                                    // console.log(obj);
                                                    setSlider(obj, $(SLIDER_TV));
                                                });
                                                return data;
                                            });
                                    })();
                                }
                            } else if (index === '2') {
                                $(SLIDER_TV).children().remove();
                                if (tvUpcoming != null) {
                                    tvUpcoming.results.forEach(obj => {
                                        setSlider(obj, $(SLIDER_TV));
                                    });
                                } else {
                                    $(SLIDER_TV).children().remove();
                                    if (tvUpcoming != null) {
                                        tvUpcoming.results.forEach(obj => {
                                            setSlider(obj, $(SLIDER_TV));
                                        });
                                    } else {
                                        (async () => {
                                            const apiTvTopRated = `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=en-US&page=1`;
                                            tvUpcoming = await getApi(apiTvTopRated)
                                                .then(data => {
                                                    // console.log('latest', data);
                                                    data.results.forEach(obj => {
                                                        // console.log(obj);
                                                        setSlider(obj, $(SLIDER_TV));
                                                    });
                                                    return data;
                                                });
                                        })();
                                    }
                                }
                            }
                        } else {
                            const detailParentId = $(navSlider).parent().parent().parent().parent().attr('id');
                            parentId = detailParentId;
                            // console.log($(navSlider).parent().parent().parent().parent().attr('id'));
                            // console.log(detailParentId);
                            // Details nav slider
                            // if (index) {
                            $(`#${detailParentId} .details-detail`).hide();
                            $(`#${detailParentId} .details-trailer`).hide();
                            $(`#${detailParentId} .details-cast`).hide();
                            $(`#${detailParentId} .details-trailer .trailer-container`).hide();
                            // console.log(index);
                            if (index === '0') {
                                $(`#${detailParentId} .details-detail`).show();
                                // $('.details-trailer').hide();
                                // $('.details-cast').hide();
                                // $('.details-trailer>.trailer-container').hide();
                            } else if (index === '1') {
                                // $('.details-detail').hide();
                                // $('.details-trailer').hide();
                                $(`#${detailParentId} .details-cast`).show();
                                // $('.details-trailer>.trailer-container').hide();
                            } else {
                                // $('.details-detail').hide();
                                $(`#${detailParentId} .details-trailer`).show();
                                // $('.details-cast').hide();
                                $(`#${detailParentId} .details-trailer>.trailer-container`).show();
                            }
                            // }
                        }
                    }

                    // PRIORITY 0
                    // Slider btn left click
                    if (e.target.closest('.slider-btn-left')) {
                        // console.log(e.target);
                        let slider = e.target.closest('.slider-btn-left').dataset.target;
                        // console.log(slider);
                        if (slider === SLIDER_MOVIE) {
                            sliderMovie.scrollTo(-1);
                        } else if (slider === SLIDER_TV) {
                            sliderTv.scrollTo(-1);
                        } else {
                            let parentDetail = e.target.closest('.slider-btn-left').parentElement.parentElement.parentElement.parentElement.parentElement.id;
                            if (parentDetail === 'searchDetails') {
                                sliderSearch.scrollTo(-1);
                            } else if (parentDetail === 'movieDetails') {
                                sliderCast.scrollTo(-1);
                            } else {
                                sliderTvDetailsCast.scrollTo(-1);
                            }
                        }
                    }
                    // Slider btn right click
                    if (e.target.closest('.slider-btn-right')) {
                        let slider = e.target.closest('.slider-btn-right').dataset.target;
                        // console.log(slider);
                        if (slider === SLIDER_MOVIE) {
                            sliderMovie.scrollTo(1);
                        } else if (slider === SLIDER_TV) {
                            sliderTv.scrollTo(1);
                        } else {
                            let parentDetail = e.target.closest('.slider-btn-right').parentElement.parentElement.parentElement.parentElement.parentElement.id;
                            // console.log(parentDetail);
                            if (parentDetail === 'searchDetails') {
                                sliderSearch.scrollTo(1);
                            } else if (parentDetail === 'movieDetails') {
                                // console.log('here');
                                // console.log(sliderCast);
                                // console.log(sliderCast.element);
                                sliderCast.scrollTo(1);
                            } else {
                                sliderTvDetailsCast.scrollTo(1);
                            }
                        }
                    }

                    // Go to top
                    if (e.target.closest('.go-to-top')) {
                        e.preventDefault();
                        $(document).scrollTop(0);
                    }

                    // Close search result dropdown on click outside of result
                    if (!e.target.closest('.search-item') && $('.search-result').is(':visible')
                        && !e.target.closest('#navSearchInputText')) {
                        $('.search-result').hide();
                    }
                    console.log($(e.target).attr('id'));
                    console.log(!e.target.closest('#navSearchInputText'));
                });

                // Slider Movie scroll event
                $(SLIDER_MOVIE).scroll((e) => {
                    clearTimeout($.data(this, "scrollCheck"));
                    $.data(this, "scrollCheck", setTimeout(function () {
                        let currentScrollLeft = $(SLIDER_MOVIE).scrollLeft();
                        let group_index = Math.floor(currentScrollLeft / sliderMovie.groupWidth) + 1;
                        // console.log(currentScrollLeft);
                        if (currentScrollLeft < sliderMovie.groupWidth && currentScrollLeft === sliderMovie.groupWidth || currentScrollLeft === 0) {
                            $('#slider-movie-btn-left').fadeOut(300, 0);
                        } else if (sliderMovie.maxScrollWidth - currentScrollLeft <= sliderMovie.sliderWidth) {
                            group_index++;
                            $('#slider-movie-btn-right').fadeOut(300, 0);
                        } else {
                            $('#slider-movie-btn-left').fadeTo(300, 1);
                            $('#slider-movie-btn-right').fadeTo(300, 1);
                        }
                        $(`.movie .slider-indicator-index`).removeClass('active');
                        $(`.movie .slider-indicator-index:nth-child(${group_index})`).addClass('active');

                    }, 50));
                });

                // Slider TV scroll event
                $(SLIDER_TV).scroll((e) => {
                    clearTimeout($.data(this, "scrollCheck"));
                    $.data(this, "scrollCheck", setTimeout(function () {
                        let currentScrollLeft = $(SLIDER_TV).scrollLeft();
                        let group_index = Math.floor(currentScrollLeft / sliderTv.groupWidth) + 1;
                        if (currentScrollLeft < sliderTv.groupWidth && currentScrollLeft === sliderTv.groupWidth || currentScrollLeft === SLIDER_PADDING) {
                            $('#slider-tv-btn-left').fadeOut(350, 0);
                        } else if (sliderTv.maxScrollWidth - currentScrollLeft <= sliderTv.sliderWidth) {
                            group_index++;
                            $('#slider-tv-btn-right').fadeOut(350, 0);
                        } else {
                            $('#slider-tv-btn-left').fadeTo(350, 1);
                            $('#slider-tv-btn-right').fadeTo(350, 1);
                        }
                        $(`.tv .slider-indicator-index`).removeClass('active');
                        $(`.tv .slider-indicator-index:nth-child(${group_index})`).addClass('active');
                    }, 100));
                });

                $('#tvDetails .slider').scroll((e) => {
                    // console.log(e);
                    // clearTimeout($.data(this, "scrollCheck"));
                    // $.data(this, "scrollCheck", setTimeout(function () {
                    //     let currentScrollLeft = $(SLIDER_TV).scrollLeft();
                    //     let group_index = Math.floor(currentScrollLeft / sliderTv.groupWidth) + 1;
                    //     if (currentScrollLeft < sliderTv.groupWidth && currentScrollLeft === sliderTv.groupWidth || currentScrollLeft === SLIDER_PADDING) {
                    //         $('#slider-tv-btn-left').fadeOut(350, 0);
                    //     } else if (sliderTv.maxScrollWidth - currentScrollLeft <= sliderTv.sliderWidth) {
                    //         group_index++;
                    //         $('#slider-tv-btn-right').fadeOut(350, 0);
                    //     } else {
                    //         $('#slider-tv-btn-left').fadeTo(350, 1);
                    //         $('#slider-tv-btn-right').fadeTo(350, 1);
                    //     }
                    //     $(`.tv .slider-indicator-index`).removeClass('active');
                    //     $(`.tv .slider-indicator-index:nth-child(${group_index})`).addClass('active');
                    // }, 100));
                });
            });

    })();


    // Nav slider
    $('.nav-slider>li>a').on('click', function () {
        $(this).parent().siblings().removeClass('active');
        $(this).parent().addClass('active');
        return false;
    });

    // Navbar search
    $('#navSearch').click((e) => {
        e.preventDefault();
        if ($('#navSearchIcon').hasClass('bi-search')) {
            $('#navSearchIcon')
                .removeClass('bi-search')
                .addClass('bi-x-lg');
            setTimeout(() => {
                $('#navSearchSelect').show();
                $('#navSearchInputText').focus()
            }, 100);
        } else {
            $('#navSearchIcon')
                .removeClass('bi-x-lg')
                .addClass('bi-search');
            $('#navSearchSelect').hide();
            $('.search-result').hide();
            $('#navSearchInputText').val('');
        }
        // $('#navSearchSelect').toggleClass('select-active');
        $('#navSearchInput').toggleClass('active');
        // return false;
    });


    // Scroll to first item on load
    $('.slider').scrollLeft(0);

    $('#navSearchInputText').on('keyup focus', () => {
        const searchInputWidth = $('#navSearchInputText').innerWidth();
        const searchInputLeft = $('#navSearchInputText').offset().left;

        $('.search-result').css({ 'width': searchInputWidth, 'left': searchInputLeft });
        let searchText = $('#navSearchInputText').val();

        let type = $('#navSearchSelect').val();
        let searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${API_KEY}&query=${searchText}`;

        (async () => {
            await getApi(searchUrl)
                .then(data => {
                    $('.search-result').html(' ');
                    data.results.forEach(obj => {
                        let fetch = $('.search-result').html();
                        $('.search-result').html(fetch + `<a href="#">
                                    <div class="search-item" data-id="${obj.id}" data-type="${type}">
                                        ${obj.title || obj.name}
                                    </div>
                                </a>`);
                    });
                    $('.search-result').show().animate({ height: 'min-content' }, 1000);
                });
        })();
    });

    

$('.navbar-toggler').on('click', function() {
    console.log('hey');
    if (!$(this).hasClass('active')) {
        $(this).addClass('active');
    } else {
        $(this).removeClass('active');
    }
});

});
// Insert trailers in carousel
function setCarousel(data, i) {
    const carousel = $('.carousel-inner').html();
    // const poster = $('.featured-poster-up-next').html();
    // const indicator = $('.carousel-indicators').html();
    let is_active;
    if (i === 0) {
        is_active = 'active';
    }
    let mediaType = '<i class="bi bi-film"></i>';
    if (data.media_type === 'tv') {
        mediaType = '<i class="bi bi-tv"></i>';
    }
    $('.carousel-inner').html(carousel + `<div class="carousel-item ${is_active}">
        <img src="${BASE_URL_IMG_ORIGINAL}${data.backdrop_path}" class="d-block w-100 carousel-img" alt="...">
        <a class="carousel-link" href="#">
            <div class="carousel-caption d-none d-md-block flex-grow-0">
                <div class="d-flex">
                    <i class="bi bi-play-circle-fill ms-2 play"></i>
                    <div class="d-flex flex-column ps-2 justify-content-center">
                        <h3>${data.title || data.name}</h3>
                        <p>
                            <i class="bi bi-star-fill star"></i>
                            ${data.vote_average.toFixed(1)}
                        </p>
                    </div>
                    <h1 class="ms-auto">${mediaType}</h1>
                </div>
            </div>
        </a>
    </div>`);
    // w220_and_h330_face
    // $('.featured-poster-up-next').html(poster + `<div class="featured-poster-up-next-content">
    //         <img src="${BASE_URL_IMG_W500}${data.poster_path}" class="" alt="${data.title || data.name}">
    //         <div>
    //             <h3>${data.title || data.name}</h3>
    //             <p>Rating: ${data.vote_average}</p>
    //         </div>
    //     </div>`);
}
function setUpNext(data) {
    const poster = $('.featured-poster-up-next').html();
    $('.featured-poster-up-next').html(poster + `<div class="featured-poster-up-next-content">
        <img src="${BASE_URL_IMG_W500}${data.poster_path}" class="" alt="${data.title || data.name}">
        <a class="#" href="">
            <div class="up-next-caption">
            <h5>${data.title || data.name}</h5>
            <p><i class="bi bi-star-fill me-2 star"></i>${data.vote_average.toFixed(1)}</p>
            <i class="bi bi-play-circle-fill ms-2 play"></i>
            </div>
        </a>
    </div>`);
}

// TODO: 
function setSlider(data, element) {
    const fetchSlider = element.html();
    const fetchIndicator = element.html();
    // element.html(fetchSlider + `<div class="slider-item" data-details="{'id':${data.id}, 'title': '${data.title || data.name}', 'release_date': '${data.release_date}', 'poster_path': '${data.poster_path}', 'rating': ${data.vote_average}}">
    // element.html(fetchSlider + `<div class="slider-item" data-details="[ '${data.id}', '${data.title || data.name}', '${data.release_date}', '${data.poster_path}', '${data.vote_average}' ]">
    // const title = JSON.stringify(data.title || data.name);
    // const overview = JSON.stringify(`${data.overview}`);
    // console.log(escape(data.overview));
    // console.log(title, overview);
    // element.html(fetchSlider + `<div class="slider-item" data-details="{\"id\": \"${data.id}\",\"title\": \"${data.title}\",\"release_date\": \"${data.release_date}\",\"poster_path\": \"${data.poster_path}\",\"rating\": \"${data.vote_average}\",\"overview\": \"${data.overview}\"}">
    // const overview = JSON.stringify(data.overview.replace("'","\'"));
    const strData = JSON.stringify(data, function (key, value) {
        if (key == 'overview') {
            return value.replace(/'/g, "’");
        } else {
            return value;
        }
    });
    // console.log('ESCAPED ', overview);
    // console.log(jQuery.parseJSON(overview));
    // element.html(fetchSlider + `<div class="slider-item" data-details='{"id": "${data.id}","title": ${data.title},"release_date": "${data.release_date}","poster_path": "${data.poster_path}","rating": "${data.vote_average}","overview": "${overview}"}'>
    element.html(fetchSlider + `<div class="slider-item" data-details='${strData}'>
        <img src="${BASE_URL_IMG_W500}${data.poster_path}" alt="${data.title || data.name}">
        <div class="slider-item-details">
            <h6>${data.title || data.name}</h6>
            <p><i class="bi bi-star-fill me-2 star"></i>${data.vote_average}</p>
        </div>
    </div>`);
}

function setCast(data, element) {
    const fetch = element.html();
    const releaseDate = data.release_date;

    let genres = [];
    data.genres.forEach(obj => {
        genres.push(obj.name);
    });

    
    // console.log(data.production_companies);

    let logoCount = 0,
        companyName = [];
    productionCompanies = '<div class="company-logo">';

    data.production_companies.forEach(obj => {
        companyName.push(obj.name);
        if (obj.logo_path !== null) {
            productionCompanies += `<img src="${BASE_URL_IMG_W500}${obj.logo_path}" alt="${obj.name}">`;
            logoCount++;
        }
    });
    productionCompanies += '</div>';

    if (logoCount === 0) {
        productionCompanies = '';
    }

    // console.log(data);

    // console.log(data.trailer);
    // console.log(data.providers);
    // xgZLXyqbYOc
    // <iframe class="trailer" src="https://www.youtube.com/embed/${data.trailer.key}"></iframe>

    // const releaseDate = new Date(data.release_date);
    // console.log(data);
    // console.log($('.details').innerHeight());
    // console.log($('.details-right').outerHeight());
    // console.log($('.details-content').outerHeight());
    // $('.show-details').css('height', $('.show-details').innerHeight());
    element.parent().css('background', `url(https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${data.backdrop_path}) no-repeat 50% 50%`);
    // element.parent().css('background', `url(${BASE_URL_IMG_ORIGINAL}${data.backdrop_path}) no-repeat 50% 50%`);
    // element.html(`<img src="${BASE_URL_IMG_W500}${data.poster_path}" alt="" id="movieDetailsPoster">
    element.html(`<div class="details-right">
        <div class="close-details">
            <button type="button" class="btn btn-lg ms-auto text-white" id="closeDetails">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="nav-slider mb-3" id="details-nav-slider">
            <button type="button" class="nav-slider-btn" data-index="0">Details</button>
            <button type="button" class="nav-slider-btn" data-index="1">Casts</button>
            <button type="button" class="nav-slider-btn" data-index="2">Trailer</button>
            <span class="nav-slider-slider"></span>
        </div>
        <div class="details-detail">
            <img class="detail-poster" src="${BASE_URL_IMG_W500}${data.poster_path}" alt="" id="movieDetailsPoster">
            <div style="padding:10px; vertical-align:center; display:flex; flex-direction: column;">
                <h3>${data.title || data.name}</h3>
                <p class="rating">
                    <i class="bi bi-star-fill me-2 star"></i>
                    <span class="me-2">${data.vote_average.toFixed(1)} / 10</span> |
                    <span class="ms-2 me-2">${data.release_date || data.first_air_date}</span> |
                    <span class="ms-2 me-2">${genres.join(', ')}</span>
                </p>
                <p class="overview">${data.overview}</p>
                <p>Director: ${data.director}</p>
                <p class="production-company">Production Companies: ${companyName.join(", ")}
                ${productionCompanies}
            </div>
        </div>
        <div class="details-cast hidden">
            <div class="media-slider">
                <button type="button" class="btn btn-lg btn-dark slider-btn-left hidden" id="slider-cast-btn-left"
                    data-target="#sliderCast">
                    <div class="chevron"><i class="bi bi-chevron-left"></i></div>
                </button>
                <button type="button" class="btn btn-lg btn-dark slider-btn-right" id="slider-cast-btn-right"
                    data-target="#sliderCast">
                    <div class="chevron"><i class="bi bi-chevron-right "></i></div>
                </button>
                <div class="slider snaps-inline" id="sliderCast"></div>
            </div>
        </div>
        <div class="details-trailer hidden">
            <div class="trailer-container hidden">
                <iframe class="trailer" src="https://www.youtube.com/embed/${data.trailer.key}" style="aspect-ratio: 1.85/1"></iframe>
            </div>
        </div>
    </div>`);
}

function setSliderCast(data, element) {
    // console.log(data);

    const fetch = element.html();
    let profile, character;
    if (data.profile_path) {
        profile = BASE_URL_IMG_W500 + data.profile_path;
    } else {
        if (data.gender === 1) {
            profile = 'img/blank-profile-female.jpg';
        } else {
            profile = 'img/blank-profile-male.jpg';
        }
    }
    if (data.type === 'movie') {
        character = data.character;
    } else {
        character = data.roles[0].character;
    }
    element.html(fetch + `<div class="slider-item">
        <div class="img-cast">
            <img src="${profile}" alt="${data.title || data.name}">
        </div>
        <h5>${data.name}</h5>
        <p>${character}</p>
    </div>`);
}

// Set first width of nav slider slider
function setNavSliderWidth(parentElement) {
    const firstNavWidth = $(`${parentElement} .nav-slider-slider`).siblings().first().innerWidth();
    $(`${parentElement} .nav-slider-slider`).css('width', firstNavWidth);
}
