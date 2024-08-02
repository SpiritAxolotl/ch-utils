import { apiFetch } from './utils/apiFetch.js';
import { followCard } from './utils/elements.js';
import { noact } from './utils/noact.js';
import { getOptions } from './utils/jsTools.js';

const boxSelector = '.co-themed-box';
const headerSelector = '.co-themed-box > h1';
const customClass = 'ch-utils-followers';

const limit = 100; // API no longer returns more than 100

const countElement = $('<span>', { class: `follow-count ${customClass}` });
const loader = $(`<span class='counter-loading ${customClass}'>(counting<span class='loader'></span>)</span>`);
const loaderButtonPlaceholder = $(`
  <button class="${customClass} load-all ml-auto flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200">
    <span class="spinner"></span>
  </button>
`);
const loaderButton = followers => noact({
  className: `${customClass} load-all ml-auto flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200`,
  onclick: async ({ target }) => {
    target.innerHTML = '<span class="spinner"></span>';
    await Promise.all(followers.map(async project => {
      const card = await followCard(customClass, project);
      if ($(`.co-project-handle[href='https://cohost.org/${project.handle}']`).length) return;
      $('.co-themed-box .mt-6').append($(card));
    }));
    $('.max-w-xs').css('display', 'none');
  },
  children: ['load all']
});

const countFollowers = async () => {
  let offset = 0;
  let projects = [];
  let total = [];

  while (projects.length === limit || offset === 0) {
    ({ projects } = await apiFetch('/v1/projects/followers', { method: 'GET', queryParams: { offset, limit } }));
    total.push(...projects);
    offset += projects.length;
  }

  return total;
};

const countFollowing = async () => {
  let batch = 1;
  let projects = [];
  let total = [];
  let input = { 0: {
    sortOrder: "recently-posted",
    limit: limit,
    beforeTimestamp: Date.now(),
    cursor: 0
  }};

  while (projects.length === limit || input[0].cursor === 0) {
    const response = await apiFetch('/v1/trpc/projects.followedFeed.query', { method: 'GET', queryParams: { batch, input } })
    projects = response[0].projects;
    total.push(...projects);
    input[0].cursor += projects.length;
  }

  return total;
};

export const main = async () => {
  const { count, loadAll } = await getOptions('followers');
  if (location.pathname !== '/rc/project/followers' || (!count && !loadAll)) return;

  $(headerSelector).addClass('flex items-start');
  if (count) {
    $(headerSelector).prepend(countElement);
    $(headerSelector).append(loader);
  }
  if (loadAll) $(headerSelector).append(loaderButtonPlaceholder);

  const followers = await countFollowers();

  if (count) {
    countElement.text(followers.length);
    loader.remove();
  }
  if (loadAll) loaderButtonPlaceholder.replaceWith(loaderButton(followers));
};

export const clean = async () => {
  $(`.${customClass}`).remove();
  $(headerSelector).removeClass('flex items-start');
};