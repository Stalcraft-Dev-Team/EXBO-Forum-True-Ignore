import {ClassTypes, MessagesTypes, StorageKeys} from "@/constants";
import {GetStorageValue, SetStorageValue} from "@/functions";

console.log('True Ignore активирован!');

const tickrate: number = 16.66666667;

// Удаление дискуссий
async function HideDiscussions() {
    let feed: Element = document.getElementsByClassName('DiscussionList-discussions')[0];
    let discussionCount: number = -1;
    let isCleaningNow: boolean = false;

    const interval = setInterval(async () => {
        if (feed === undefined || (feed && feed.classList.contains(ClassTypes.HasEvent))) {
            feed = document.getElementsByClassName('DiscussionList-discussions')[0];
        } else {
            feed.classList.add(ClassTypes.HasEvent)
            const result: boolean = await GetStorageValue(StorageKeys.HideDiscussions);
            if (result) {
                hideIgnoredDiscussions();
                const observer = new MutationObserver(mutationList =>
                    mutationList
                        .filter(m => m.type === 'childList')
                        .forEach(m => {
                            m.addedNodes.forEach(() => {
                                if (isCleaningNow)
                                    return;

                                isCleaningNow = true;
                                hideIgnoredDiscussions();
                                isCleaningNow = false;
                            });
                        }));
                observer.observe(feed, {childList: true, subtree: true});
            } else {
                console.log('Удаление дискуссий выключено.')
            }
            clearInterval(interval);
        }
    }, tickrate);

    function hideIgnoredDiscussions() {
        // if (feed.childNodes.length === discussionCount)
        //     return;
        // Тут пока баг, если вернуть то жопа

        const dataIdsToDelete: string[] = [];

        console.log('Поиск непотребных дискуссий...');
        feed.childNodes.forEach((li) => {
            const _li: HTMLLIElement = li as HTMLLIElement;
            if (_li.getElementsByClassName('item-user-discussion-ignored')[0] && _li.dataset?.id) {
                dataIdsToDelete.push(_li.dataset.id);
            }
        });

        const elemsToHide: HTMLLIElement[] = [];
        dataIdsToDelete.forEach((dataId: string) => {
            const elem = document.querySelector(`[data-id="${dataId}"]`);
            if (elem && !elem.classList.contains(ClassTypes.HideElement))
                elemsToHide.push(elem as HTMLLIElement);
        });

        if (elemsToHide.length > 0) {
            console.log('Удаление непотребных дискуссий...');

            elemsToHide.forEach((elem) => {
                elem.style.display = 'none';
                elem.classList.add(ClassTypes.HideElement);
            });

            console.log('Непотребные дискуссии удалены!');
        }

        discussionCount = feed.childNodes.length;
    }
}


// Удаление сообщений в дискуссиях
async function HideMessagesInDiscussions() {
    let messagesFeed: Element = document.getElementsByClassName('PostStream')[0];
    let messagesCount: number = -1;
    let isCleaningNow: boolean = false;

    const interval = setInterval(async () => {
        if (messagesFeed === undefined || (messagesFeed && messagesFeed.classList.contains(ClassTypes.HasEvent))) {
            messagesFeed = document.getElementsByClassName('PostStream')[0];
        } else {
            messagesFeed.classList.add(ClassTypes.HasEvent);
            const result: boolean = await GetStorageValue(StorageKeys.HideMessages);
            if (result) {
                hideMessages();
                await hideReplies();
                const observer = new MutationObserver(mutationList =>
                    mutationList
                        .filter(m => m.type === 'childList')
                        .forEach(m => {
                            m.addedNodes.forEach(async () => {
                                if (isCleaningNow)
                                    return;

                                isCleaningNow = true;
                                hideMessages();
                                await hideReplies();
                                isCleaningNow = false;
                            });
                        }));
                observer.observe(messagesFeed, {childList: true, subtree: true});
            } else {
                console.log('Удаление сообщений выключено.')
            }
            clearInterval(interval);
        }
    }, tickrate);

    function hideMessages() {
        // if (messagesFeed.childNodes.length === messagesCount)
        //     return;
        // Тута пока баг, если вернуть то жопа

        const dataIdsToDelete: string[] = [];

        console.log('Поиск непотребных сообщений...');
        messagesFeed.childNodes.forEach((div) => {
            const _div: HTMLDivElement = div as HTMLDivElement;
            if (GetExtensionUserNickname() === GetMessageCreatorNickname(_div))
                return;

            if (_div.getElementsByClassName('Post--hidden')[0] && _div.dataset?.id) {
                dataIdsToDelete.push(_div.dataset.id);
            }
        });

        const elemsToHide: HTMLDivElement[] = [];
        dataIdsToDelete.forEach((dataId: string) => {
            const elem = document.querySelector(`[data-id="${dataId}"]`);

            if (elem && !elem.classList.contains(ClassTypes.HideElement))
                elemsToHide.push(elem as HTMLDivElement);
        });

        if (elemsToHide.length > 0) {
            console.log('Удаление непотребных сообщений...');

            elemsToHide.forEach((elem) => {
                elem.style.display = 'none';
                elem.classList.add(ClassTypes.HideElement);
            });

            console.log('Непотребные сообщения удалены!');
        }

        messagesCount = messagesFeed.childNodes.length;
    }

    // Удаление заблокированных пользователей в надписи "ответили на сообщение"
    async function hideReplies() {
        const ignoredUsers: string[] = await GetStorageValue(StorageKeys.IgnoredUsers);
        if (ignoredUsers === undefined) {
            return;
        }

        console.log('Поиск непотребных ответов на сообщения...');
        const dataNumberIdsToDelete: (string | number)[] = [];

        messagesFeed.childNodes.forEach((div) => {

            const _div: HTMLDivElement = div as HTMLDivElement;
            let anchorCount: (ChildNode | undefined)[] = [];
            const spanMentionedBySummary = _div.querySelector('.Post-mentionedBy-summary');
            const ulMentionByPreview = spanMentionedBySummary
                ?.parentNode
                ?.parentNode
                ?.parentNode
                ?.parentNode
                ?.parentNode
                ?.parentNode
                ?.querySelector('.Post-mentionedBy-preview');
            if (ulMentionByPreview) {
                spanMentionedBySummary?.addEventListener('mouseover', (e) => {
                    const interval = setInterval(() => {
                        if (ulMentionByPreview.childNodes.length > 0) {
                            clearInterval(interval);
                            (ulMentionByPreview.childNodes as NodeListOf<HTMLLIElement>).forEach((li: HTMLLIElement) => {
                                if (dataNumberIdsToDelete.includes(li.getAttribute('data-number') || '')) {
                                    li.remove();
                                }
                            });
                        }
                    }, tickrate);
                });
            }
            let iconEl = undefined;

            if (spanMentionedBySummary) {
                spanMentionedBySummary.childNodes.forEach((value: ChildNode, key: number, parent: NodeListOf<ChildNode>) => {
                    if (value.nodeName === 'I') {
                        iconEl = value;
                    }
                    if (
                        value.nodeName === 'A' && anchorCount.push(value)
                        && ignoredUsers.includes((value as HTMLAnchorElement).text)
                    ) {
                        dataNumberIdsToDelete.push((value as HTMLAnchorElement)?.getAttribute('data-number') || -1);
                        anchorCount[anchorCount.length - 1] = undefined;
                    }
                });

                anchorCount = anchorCount.filter((el) => el);

                if (spanMentionedBySummary.childNodes.length > 0 && anchorCount.length === 0) {
                    // const footer = _div.querySelector('.Post-footer');
                    // const footerUl = footer?.querySelector('ul');
                    // footerUl?.querySelector('.item-replies')?.remove();
                    // if (footerUl?.childNodes?.length === 0) {
                    //     footer?.remove();
                    // }
                    spanMentionedBySummary.remove();
                } else if (anchorCount.length > 0) {
                    spanMentionedBySummary.innerHTML = '';
                    spanMentionedBySummary.appendChild(iconEl as unknown as HTMLElement);
                    for (let i = 0; i < anchorCount.length; i++) {
                        const el = (anchorCount as ChildNode[])[i];
                        spanMentionedBySummary.appendChild(el);
                        if (i === anchorCount.length - 1) {
                            if (anchorCount.length === 1) {
                                spanMentionedBySummary.innerHTML += ' ответил(-a) на это сообщение.';
                            } else {
                                spanMentionedBySummary.innerHTML += ' ответили на это сообщение.';
                            }
                            break;
                        }
                        if (i === anchorCount.length - 2) {
                            spanMentionedBySummary.innerHTML += ' и ';
                            break;
                        }
                        if (i < anchorCount.length - 2) {
                            spanMentionedBySummary.innerHTML += ', ';
                            break;
                        }
                    }
                }
            }

        });

        if (dataNumberIdsToDelete.length > 0) {
            console.log('Непотребные ответы на сообщения удалены!');
        }
    }
}

// Получить ник сообщения в дискуссии
function GetMessageCreatorNickname(div: HTMLDivElement): string {
    const postUserDiv = div.querySelector('.PostUser'),
        a = postUserDiv?.getElementsByTagName('a')[0],
        nickname: string = (a?.href || '/u/').split('/u/')[1];

    return nickname;
}

// Получить ник пользователя расширения
function GetExtensionUserNickname(): string {
    return document.querySelector('.username')?.textContent || '';
}


// Скрытие уведомлений на сайте от игноров
async function HideNotifications() {
    if (await GetStorageValue(StorageKeys.HideNotifications) === false) {
        console.log('Удаление уведомлений отключено.');
        return;
    }

    const ignoredUsers: string[] = await GetStorageValue(StorageKeys.IgnoredUsers);
    if (!ignoredUsers || ignoredUsers.length === 0) {
        console.log("Не собран список игнорируемых пользователей.");
        return;
    }

    const interval = setInterval(async () => {

        const li_container = document.querySelector('.item-notifications');
        if (li_container && !li_container.classList.contains(ClassTypes.HasEvent)) {
            clearInterval(interval);
            li_container.classList.add(ClassTypes.HasEvent);
            li_container.addEventListener('click', async (event) => {
                const dropdown = li_container.querySelector('.NotificationsDropdown');
                const isOpen: boolean = !dropdown?.classList.contains('open');
                if (dropdown && isOpen) {
                    let content: Element;
                    let notificationsCount: number = -1;
                    let isCleaningNow: boolean = false;
                    const interval = setInterval(() => {

                        if (content === undefined || (content && content.classList.contains(ClassTypes.HasEvent))) {
                            content = dropdown.querySelector('.NotificationList-content') as Element;
                        } else {
                            content.classList.add(ClassTypes.HasEvent);
                            clearNotifications();

                            const observer = new MutationObserver(mutationList =>
                                mutationList
                                    .filter(m => m.type === 'childList')
                                    .forEach(m => {
                                        m.addedNodes.forEach(() => {
                                            if (isCleaningNow)
                                                return;

                                            isCleaningNow = true;
                                            clearNotifications();
                                            isCleaningNow = false;
                                        });
                                    }));
                            observer.observe(content, {childList: true, subtree: false});

                            clearInterval(interval);
                        }

                    }, tickrate);

                    function clearNotifications() {
                        if (content.childNodes.length === notificationsCount)
                            return;

                        console.log("Поиск непотребных уведомлений...");
                        const groups = content.getElementsByClassName('NotificationGroup');
                        content.querySelector('.hiddenHighElem')?.remove();
                        for (let group of groups) {
                            console.log(group)
                            const badges = group.querySelector('.NotificationGroup-badges');
                            const badgesLIs = badges?.querySelectorAll('li');
                            if (badgesLIs) {
                                let deleteConfirmed: boolean = false;
                                let isPrivate: boolean = false;
                                let userIgnored: boolean = false;
                                for (let badgesLI of badgesLIs) {
                                    if (badgesLI.classList.contains('item-user-discussion-ignored')) {
                                        userIgnored = true;
                                    }
                                    if (badgesLI.classList.contains('item-private')) {
                                        isPrivate = true;
                                    }
                                }

                                if (isPrivate && userIgnored) {
                                    deleteConfirmed = true;
                                    console.log(`Удалено уведомление от переписки с заблокированным пользователем`);
                                    group.classList.add(ClassTypes.HideElement)
                                    // @ts-ignore
                                    group.style.display = 'none';
                                    break;
                                }

                                if (deleteConfirmed) {
                                    continue;
                                }
                            }

                            const users = group.querySelector('.NotificationGroup-content');
                            const LIs = users?.getElementsByTagName('li');
                            if (users && LIs) {
                                let hiddenNotificationsCount: number = 0;
                                for (let li of LIs) {
                                    const username = li?.querySelector('.username')?.innerHTML as string;
                                    if (
                                        !li.classList.contains(ClassTypes.HideElement)
                                        && ignoredUsers.includes(username)
                                    ) {
                                        hiddenNotificationsCount += 1;
                                        console.log(`Удалено уведомление от ${username}`);
                                        li.classList.add(ClassTypes.HideElement)
                                        li.style.display = 'none';
                                    }
                                }

                                if (LIs.length === hiddenNotificationsCount) {
                                    group.classList.add(ClassTypes.HideElement)
                                    // @ts-ignore
                                    group.style.display = 'none';
                                }
                            }
                        }

                        const contentHeight = content.getBoundingClientRect().height;
                        const maxContentHeightInPx = (document.documentElement.clientHeight * 0.7);
                        if (contentHeight < maxContentHeightInPx) {
                            const hiddenHighElem = document.createElement('div');
                            hiddenHighElem.classList.add('hiddenHighElem');
                            hiddenHighElem.style.height = `${maxContentHeightInPx - contentHeight}px`;
                            hiddenHighElem.style.opacity = '0';
                            const lastGroup = groups.item(groups.length - 1);
                            lastGroup?.after(hiddenHighElem);
                        }

                        notificationsCount = content.childNodes.length;
                    }
                }
            });
        }

    }, tickrate)

}


// Сбор инфы о том кто заблокирован
async function CollectIgnoredUsers() {
    let secsToTry = 10;
    const interval = setInterval(async () => {
        if (secsToTry <= 0) {
            clearInterval(interval);
        } else {
            secsToTry -= (tickrate / 1000);
        }
        const table = document.getElementsByClassName('NotificationGrid')[0]
        if (table) {
            const names: string[] = []
            for (let aTag of table.getElementsByTagName('a')) {
                names.push(aTag.innerText.replaceAll(' ', ''));
            }
            clearInterval(interval);
            console.log(await SetStorageValue(StorageKeys.IgnoredUsers, names));
            window.alert("Список игнорируемых пользователей собран.\nТеперь удаление уведомлений будет работать корректно.");
        }
    }, tickrate);
}


// Чтение сообщений c service_worker
chrome.runtime.onMessage.addListener(async (message: string, sender, sendResponse) => {
    const response = {result: true, error: ''};

    setTimeout(async () => {
        HideNotifications();

        switch (message) {
            case MessagesTypes.DeleteDiscussionsSubscribe: {
                await HideDiscussions();
                break;
            }
            case MessagesTypes.DeleteMessagesInDiscussions: {
                await HideMessagesInDiscussions();
                break;
            }
            case MessagesTypes.CollectIgnoredUsers: {
                await CollectIgnoredUsers(); // future content
                break;
            }
            default: {
                response.result = false;
                response.error = 'Incorrect message type';
                throw new Error('Incorrect message type');
            }
        }

        await sendResponse(response);
    }, tickrate)
});