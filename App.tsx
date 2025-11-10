import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp, writeBatch, where, limit, Timestamp, addDoc, getDocs } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './components/pages/HomePage';
import TestView from './components/pages/TestView';
import HistoryPage from './components/pages/HistoryPage';
import AboutPage from './components/pages/AboutPage';
import ContactPage from './components/pages/ContactPage';
import PrivacyPolicyPage from './components/pages/PrivacyPolicyPage';
import CustomPageView from './components/pages/CustomPageView';
import MobileMenu from './components/layout/MobileMenu';
import AdminDashboard from './components/admin/AdminDashboard';
import ProfilePage from './components/pages/ProfilePage';
import SettingsPage from './components/pages/SettingsPage';
import Breadcrumbs from './components/layout/Breadcrumbs';
import { Test, UserResult, Category, UserProfile, FooterLink, CurrentAffairsSection, Notification, UpdateArticle, CustomPage } from './types';
import { showMessage } from './utils/helpers';
import InstructionsPage from './components/pages/InstructionsPage';
import NotificationDetailModal from './components/modals/NotificationDetailModal';
import ChatModal from './components/modals/ChatModal';
import UpdatesPage from './components/pages/UpdatesPage';
import UpdateArticleView from './components/pages/UpdateArticleView';
import AuthModal from './components/modals/AuthModal';

export type ViewType = 'home' | 'history' | 'about' | 'contact' | 'privacy' | 'admin' | 'profile' | 'settings' | 'updates' | 'updateArticle';
export const AuthContext = React.createContext<{ user: User | null, userProfile: UserProfile | null }>({ user: null, userProfile: null });

type ActiveTestData = {
    test: Test;
    action: 'start' | 'resume' | 'result';
    resultData?: UserResult;
    language: 'english' | 'hindi';
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [view, setView] = useState<ViewType>('home');
    const [lastView, setLastView] = useState<ViewType>('home');
    const [isAdminView, setIsAdminView] = useState(false);
    const [activeTestData, setActiveTestData] = useState<ActiveTestData | null>(null);
    const [testForInstructions, setTestForInstructions] = useState<Test | null>(null);
    const [activePageSlug, setActivePageSlug] = useState<string | null>(null);
    const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [categories, setCategories] = useState<Category[]>([]);
    const [currentAffairsSections, setCurrentAffairsSections] = useState<CurrentAffairsSection[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string }>({ id: '', name: 'All Tests' });
    const [selectedCurrentAffairsSection, setSelectedCurrentAffairsSection] = useState<{ id: string, name: string }>({ id: '', name: 'All' });
    const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
    
    // Breadcrumb state
    const [breadcrumbs, setBreadcrumbs] = useState<{ label: string, path?: string }[]>([]);
    const [customPageTitle, setCustomPageTitle] = useState<string | null>(null);

    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationToShow, setNotificationToShow] = useState<Notification | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [authModalState, setAuthModalState] = useState({ isOpen: false, initialView: 'signin' as 'signin' | 'signup' });


    useEffect(() => {
        const stylesDocRef = doc(db, 'uiSettings', 'dynamicStyles');
        const unsubscribe = onSnapshot(stylesDocRef, (docSnap) => {
            const existingStyleElement = document.getElementById('live-dynamic-styles');
            if (existingStyleElement) {
                existingStyleElement.remove();
            }

            if (docSnap.exists()) {
                const css = docSnap.data().css;
                if (css) {
                    const styleElement = document.createElement('style');
                    styleElement.id = 'live-dynamic-styles';
                    styleElement.innerHTML = css;
                    document.head.appendChild(styleElement);
                }
            }
        }, (error) => {
            console.error("Could not listen to dynamic UI styles:", error);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                const isDefaultAdmin = currentUser.email === 'resotainofficial@gmail.com';

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const profile: UserProfile = {
                        uid: currentUser.uid,
                        email: data.email,
                        role: isDefaultAdmin ? 'admin' : data.role,
                        createdAt: data.createdAt,
                        name: data.name || currentUser.displayName || currentUser.email!.split('@')[0],
                        mobileNumber: data.mobileNumber || '',
                        notificationSettings: data.notificationSettings ?? { newContent: true, adminReplies: true },
                    };
                    setUserProfile(profile);
                } else {
                    const role = isDefaultAdmin ? 'admin' : 'user';
                    const name = currentUser.displayName || currentUser.email!.split('@')[0];
                    const newProfile: UserProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email!,
                        name: name,
                        role: role,
                        createdAt: serverTimestamp() as any,
                        mobileNumber: '',
                        notificationSettings: { newContent: true, adminReplies: true },
                    };
                    setUserProfile(newProfile);
                    await setDoc(userDocRef, {
                        name: name,
                        email: currentUser.email,
                        createdAt: serverTimestamp(),
                        role: role,
                        mobileNumber: '',
                        notificationSettings: { newContent: true, adminReplies: true },
                    });
                }
            } else {
                setUserProfile(null);
                setIsAdminView(false);
                setNotifications([]);
            }
        });

        const qCategories = query(collection(db, 'testCategories'), orderBy('name'));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoadingCategories(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            showMessage("Error: Could not load categories.", true);
            setLoadingCategories(false);
        });

        const qCASections = query(collection(db, 'currentAffairsSections'), orderBy('name'));
        const unsubscribeCASections = onSnapshot(qCASections, (snapshot) => {
            const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CurrentAffairsSection));
            setCurrentAffairsSections(sectionsData);
        });
        
        const footerConfigRef = doc(db, 'uiSettings', 'footer');
        const unsubscribeFooter = onSnapshot(footerConfigRef, (doc) => {
            if (doc.exists()) {
                setFooterLinks(doc.data().links || []);
            } else {
                 setFooterLinks([
                    { label: 'Home', path: 'home' },
                    { label: 'My Results', path: 'history' },
                    { label: 'About Us', path: 'about' },
                    { label: 'Contact Us', path: 'contact' },
                    { label: 'Privacy Policy', path: 'privacy' },
                 ]);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeCategories();
            unsubscribeFooter();
            unsubscribeCASections();
        };
    }, []);

    // Effect for notifications and new content check
     useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        // Listen for notifications
        const notifQuery = query(
            collection(db, 'users', user.uid, 'notifications'), 
            orderBy('createdAt', 'desc'), 
            limit(15)
        );
        const unsubscribeNotifs = onSnapshot(notifQuery, (snapshot) => {
            const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifsData);
        });

        // Check for new content
        const checkNewContent = async () => {
            if (userProfile?.notificationSettings?.newContent === false) {
                // If user has disabled this notification, clear any pending server-side counter and exit
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().newTests > 0) {
                     await setDoc(doc(db, 'users', user.uid), { newTests: 0 }, { merge: true });
                }
                return;
            };

            const lastCheckString = localStorage.getItem(`lastContentCheck_${user.uid}`);
            const lastCheckTimestamp = lastCheckString ? Timestamp.fromDate(new Date(lastCheckString)) : Timestamp.fromDate(new Date(0));
            
            const contentQuery = query(
                collection(db, 'tests'),
                where('status', '==', 'published'),
                where('createdAt', '>', lastCheckTimestamp)
            );

            const contentSnapshot = await getDoc(doc(db, 'users', user.uid));
            if (contentSnapshot.exists()) {
                const newTests = contentSnapshot.data().newTests || 0;
                if (newTests > 0) {
                     const message = newTests === 1 ? '1 new test has been added!' : `${newTests} new tests have been added!`;
                     const userNotificationsRef = collection(db, 'users', user.uid, 'notifications');
                     await addDoc(userNotificationsRef, {
                         type: 'new_content',
                         message: message,
                         link: 'home',
                         createdAt: serverTimestamp(),
                         isRead: false,
                     });
                     // Reset the counter
                     await setDoc(doc(db, 'users', user.uid), { newTests: 0 }, { merge: true });
                }
            }
            localStorage.setItem(`lastContentCheck_${user.uid}`, new Date().toISOString());
        };
        checkNewContent();


        return () => {
            unsubscribeNotifs();
        };
    }, [user, userProfile]);

     useEffect(() => {
        const newBreadcrumbs: { label: string, path?: string }[] = [{ label: 'Home', path: 'home' }];

        const findCategoryPath = (catId: string, allCats: Category[]): Category[] => {
            const path: Category[] = [];
            let currentCat = allCats.find(c => c.id === catId);
            while (currentCat) {
                path.unshift(currentCat);
                currentCat = allCats.find(c => c.id === currentCat?.parentId);
            }
            return path;
        };

        const findCASectionPath = (sectionId: string, allSections: CurrentAffairsSection[]): CurrentAffairsSection[] => {
            const path: CurrentAffairsSection[] = [];
            let current = allSections.find(s => s.id === sectionId);
            while(current) {
                path.unshift(current);
                current = allSections.find(s => s.id === current?.parentId);
            }
            return path;
        }
        
        if (testForInstructions) {
            newBreadcrumbs.push({ label: testForInstructions.title });
        } else if (isAdminView) {
            newBreadcrumbs.push({ label: 'Admin Dashboard' });
        } else if (activeTestData) {
            if (activeTestData.action === 'result' && view === 'history') {
                newBreadcrumbs.push({ label: 'My Results', path: 'history' });
            }
            newBreadcrumbs.push({ label: activeTestData.test.title });
        } else if (activePageSlug) {
            newBreadcrumbs.push({ label: customPageTitle || '...' });
        } else if (activeArticleSlug) {
            newBreadcrumbs.push({ label: 'Updates', path: 'updates' });
            newBreadcrumbs.push({ label: customPageTitle || '...' });
        } else {
            switch(view) {
                case 'home':
                    if (selectedCategory.id) {
                        newBreadcrumbs.push({ label: 'Test Categories', path: 'home' });
                        const categoryPath = findCategoryPath(selectedCategory.id, categories);
                        categoryPath.forEach(cat => {
                            newBreadcrumbs.push({ label: cat.name, path: `category:${cat.id}` });
                        });
                    } else if (selectedCurrentAffairsSection.id) {
                         newBreadcrumbs.push({ label: 'Current Affairs', path: 'home' });
                        const sectionPath = findCASectionPath(selectedCurrentAffairsSection.id, currentAffairsSections);
                        sectionPath.forEach(sec => {
                            newBreadcrumbs.push({ label: sec.name, path: `ca-section:${sec.id}` });
                        });
                    }
                    break;
                case 'updates':
                    newBreadcrumbs.push({ label: 'Updates' });
                    break;
                case 'history':
                    newBreadcrumbs.push({ label: 'My Results' });
                    break;
                case 'about':
                    newBreadcrumbs.push({ label: 'About Us' });
                    break;
                case 'contact':
                    newBreadcrumbs.push({ label: 'Contact Us' });
                    break;
                case 'privacy':
                    newBreadcrumbs.push({ label: 'Privacy Policy' });
                    break;
                case 'profile':
                    newBreadcrumbs.push({ label: 'My Profile' });
                    break;
                case 'settings':
                    newBreadcrumbs.push({ label: 'Settings' });
                    break;
            }
        }

        setBreadcrumbs(newBreadcrumbs);
    }, [view, isAdminView, activeTestData, activePageSlug, activeArticleSlug, selectedCategory, categories, customPageTitle, testForInstructions, selectedCurrentAffairsSection, currentAffairsSections]);
    
    // SEO Effect
    useEffect(() => {
        const createSnippet = (htmlContent: string, length = 155) => {
            if (!htmlContent) return '';
            const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            return text.length > length ? text.substring(0, length) + '...' : text;
        };

        const setSeoData = async () => {
            // Cleanup previous schema
            const existingSchema = document.getElementById('json-ld-schema');
            if (existingSchema) {
                existingSchema.remove();
            }

            let title = 'ExamPrep Hub | High-Quality Mock Exams for All Tests';
            let description = 'An interactive and comprehensive platform for taking mock exams. Features user authentication, categorized tests, real-time test-taking with a timer, result analysis with charts, and detailed solution reviews.';
            let schema: any = {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'ExamPrep Hub',
                url: window.location.origin,
            };

            if (testForInstructions) {
                title = `Instructions for ${testForInstructions.title} | ExamPrep Hub`;
                description = `Prepare for the ${testForInstructions.title} mock exam. Review instructions, duration: ${testForInstructions.durationMinutes} mins, and marking scheme before you begin.`;
                schema = {
                    '@context': 'https://schema.org',
                    '@type': 'Quiz',
                    name: testForInstructions.title,
                    description: description,
                    educationalLevel: "Professional",
                };
            } else if (activeArticleSlug) {
                try {
                    const q = query(collection(db, 'updateArticles'), where("slug", "==", activeArticleSlug), limit(1));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const article = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UpdateArticle;
                        title = `${article.metaTitle || article.title} | ExamPrep Hub`;
                        description = article.metaDescription || createSnippet(article.content);
                        schema = {
                            '@context': 'https://schema.org',
                            '@type': 'Article',
                            mainEntityOfPage: {
                                '@type': 'WebPage',
                                '@id': `${window.location.origin}/#update/${article.slug}`,
                            },
                            headline: article.title,
                            description: description,
                            image: article.featuredImageUrl || '',
                            author: {
                                '@type': 'Organization',
                                name: 'ExamPrep Hub',
                            },
                            publisher: {
                                '@type': 'Organization',
                                name: 'ExamPrep Hub',
                                logo: {
                                    '@type': 'ImageObject',
                                    url: `${window.location.origin}/vite.svg`,
                                },
                            },
                            datePublished: article.publishAt.toDate().toISOString(),
                            dateModified: article.updatedAt ? article.updatedAt.toDate().toISOString() : article.publishAt.toDate().toISOString(),
                        };
                    }
                } catch (e) {
                    console.error("Error fetching article for SEO", e);
                }
            } else if (activePageSlug) {
                 try {
                    const q = query(collection(db, 'customPages'), where("slug", "==", activePageSlug), limit(1));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const page = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CustomPage;
                        title = `${page.title} | ExamPrep Hub`;
                        description = createSnippet(page.content);
                        schema = {
                            '@context': 'https://schema.org',
                            '@type': 'WebPage',
                            name: page.title,
                            description: description,
                            url: `${window.location.origin}/#${page.slug}`,
                        };
                    }
                } catch (e) {
                    console.error("Error fetching custom page for SEO", e);
                }
            } else {
                switch(view) {
                    case 'home':
                        // default is already set for home
                        break;
                    case 'updates':
                        title = 'Latest Updates & Articles | ExamPrep Hub';
                        description = 'Stay informed with the latest articles, announcements, and content updates from ExamPrep Hub.';
                        break;
                    case 'history':
                        title = 'My Test History & Results | ExamPrep Hub';
                        description = 'Review your past test performance, analyze your results, and track your progress over time on ExamPrep Hub.';
                        break;
                    case 'about':
                        title = 'About ExamPrep Hub';
                        description = 'Learn about our mission to empower students and professionals by providing an interactive and comprehensive platform for mock exams.';
                        break;
                    case 'contact':
                        title = 'Contact Us | ExamPrep Hub';
                        description = 'Have questions or feedback? Get in touch with the ExamPrep Hub team. We would love to hear from you.';
                        break;
                    case 'privacy':
                        title = 'Privacy Policy | ExamPrep Hub';
                        description = 'Read the ExamPrep Hub privacy policy to understand how we collect, use, and protect your personal information.';
                        break;
                    case 'profile':
                        title = 'My Profile | ExamPrep Hub';
                        description = 'Manage your profile details and view your performance statistics on ExamPrep Hub.';
                        break;
                    case 'settings':
                        title = 'Settings | ExamPrep Hub';
                        description = 'Customize your account settings, including appearance, notifications, and security on ExamPrep Hub.';
                        break;
                }
            }

            // Apply changes
            document.title = title;
            const metaDesc = document.getElementById('meta-description');
            if (metaDesc) {
                metaDesc.setAttribute('content', description);
            }

            const script = document.createElement('script');
            script.id = 'json-ld-schema';
            script.type = 'application/ld+json';
            script.innerHTML = JSON.stringify(schema);
            document.head.appendChild(script);
        };

        setSeoData();

        // Cleanup function
        return () => {
            const existingSchema = document.getElementById('json-ld-schema');
            if (existingSchema) {
                existingSchema.remove();
            }
        };
    }, [view, activeArticleSlug, activePageSlug, testForInstructions]);

    const handleMarkAsRead = async (ids: string[]) => {
        if (!user || ids.length === 0) return;
        const batch = writeBatch(db);
        ids.forEach(id => {
            const notifRef = doc(db, 'users', user.uid, 'notifications', id);
            batch.update(notifRef, { isRead: true });
        });
        await batch.commit();
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.type === 'admin_reply') {
            setNotificationToShow(notification);
        } else if (notification.type === 'chat_reply') {
            setIsChatModalOpen(true);
        } else if (notification.link) {
            handleNavigation(notification.link);
        }
    };

    const staticViews: ViewType[] = ['home', 'history', 'about', 'contact', 'privacy', 'admin', 'profile', 'settings', 'updates'];

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        // When a search is performed, reset category filters to search globally
        if (query.trim() !== '') {
            setSelectedCategory({ id: '', name: 'All Tests' });
            setSelectedCurrentAffairsSection({ id: '', name: 'All' });
            // Ensure we are on the home page to display results
            if (view !== 'home' || testForInstructions || activeTestData || activePageSlug || activeArticleSlug) {
                setActiveTestData(null);
                setTestForInstructions(null);
                setActivePageSlug(null);
                setActiveArticleSlug(null);
                setIsAdminView(false);
                setView('home');
            }
        }
    };

    const handleNavigation = (newView: string, isBackAction = false) => {
        if (!isBackAction && view !== newView) {
            setLastView(view);
        }
        
        setIsMobileMenuOpen(false);
        setActiveTestData(null);
        setTestForInstructions(null);
        setActivePageSlug(null);
        setActiveArticleSlug(null);
        setIsAdminView(false);

        if (newView.startsWith('category:')) {
            const catId = newView.split(':')[1];
            const category = categories.find(c => c.id === catId);
            if (category) {
                setSelectedCategory({ id: catId, name: category.name });
                setSelectedCurrentAffairsSection({ id: '', name: 'All' });
            }
            setView('home');
        } else if (newView.startsWith('ca-section:')) {
            const sectionId = newView.split(':')[1];
            const section = currentAffairsSections.find(s => s.id === sectionId);
            if(section) {
                setSelectedCurrentAffairsSection({ id: sectionId, name: section.name });
                setSelectedCategory({ id: '', name: 'All Tests' });
            }
            setView('home');
        } else if (newView.startsWith('update/')) {
            const slug = newView.split('/')[1];
            setActiveArticleSlug(slug);
            setView('updateArticle');
        } else if (staticViews.includes(newView as ViewType)) {
            setView(newView as ViewType);
            if (newView === 'home') {
                setSearchQuery('');
                setSelectedCategory({ id: '', name: 'All Tests' });
                setSelectedCurrentAffairsSection({ id: '', name: 'All' });
            }
            if (newView === 'admin') {
                setIsAdminView(true);
            }
        } else {
            setActivePageSlug(newView);
        }
    };

    const handleBack = () => {
        handleNavigation(lastView, true);
    };

    const handleSelectCategory = (category: { id: string, name: string }) => {
        setSelectedCategory(category);
        setSelectedCurrentAffairsSection({id: '', name: 'All'});
        setSearchQuery('');
        setIsMobileMenuOpen(false);
        setView('home');
    };
    
    const handleSelectCurrentAffairsSection = (section: {id: string, name: string}) => {
        setSelectedCurrentAffairsSection(section);
        setSelectedCategory({id: '', name: 'All Tests'});
        setSearchQuery('');
        setIsMobileMenuOpen(false);
        setView('home');
    }

    const handleInitiateTestView = (details: ActiveTestData) => {
        setActiveTestData(details);
    };

    const handleShowInstructions = (test: Test) => {
        setTestForInstructions(test);
    };

    const handleStartTest = (language: 'english' | 'hindi') => {
        if (testForInstructions) {
            handleInitiateTestView({ test: testForInstructions, action: 'start', language });
            setTestForInstructions(null);
        }
    };

    const exitTestView = () => {
        setActiveTestData(null);
        if (user) { // If user is logged in, show their results page after a test
            setView('history');
        } else { // Otherwise, go home
            setView('home');
        }
    };
    
    const handleSwitchToUserView = () => {
        setIsAdminView(false);
        setView('home');
    };

    const renderView = () => {
        if (isAdminView) {
            return <AdminDashboard />;
        }
        if (testForInstructions) {
            return <InstructionsPage test={testForInstructions} onStartTest={handleStartTest} onBack={() => setTestForInstructions(null)} />;
        }
        if (activeTestData) {
            return <TestView {...activeTestData} onExitTestView={exitTestView} />;
        }
        if (activePageSlug) {
            return <CustomPageView slug={activePageSlug} onNavigate={handleNavigation} onBack={handleBack} onPageLoad={setCustomPageTitle} />;
        }
        if (activeArticleSlug) {
            return <UpdateArticleView 
                slug={activeArticleSlug} 
                onNavigate={handleNavigation} 
                onPageLoad={setCustomPageTitle}
                onInitiateTestView={handleInitiateTestView}
                onShowInstructions={handleShowInstructions}
            />;
        }
        switch (view) {
            case 'home':
                return <HomePage 
                    onInitiateTestView={handleInitiateTestView} 
                    onShowInstructions={handleShowInstructions}
                    categories={categories} 
                    loadingCategories={loadingCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    currentAffairsSections={currentAffairsSections}
                    onSelectCurrentAffairsSection={handleSelectCurrentAffairsSection}
                    selectedCurrentAffairsSection={selectedCurrentAffairsSection}
                    searchQuery={searchQuery}
                    onNavigate={handleNavigation}
                    onOpenAuthModal={(initialView = 'signup') => setAuthModalState({ isOpen: true, initialView })}
                />;
            case 'updates':
                return <UpdatesPage onNavigate={handleNavigation} />;
            case 'history':
                return <HistoryPage onInitiateTestView={handleInitiateTestView} />;
            case 'about':
                return <AboutPage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'contact':
                return <ContactPage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'privacy':
                return <PrivacyPolicyPage onNavigate={handleNavigation} onBack={handleBack} />;
            case 'profile':
                 return <ProfilePage onNavigate={handleNavigation} onBack={handleBack} onInitiateTestView={handleInitiateTestView} />;
            case 'settings':
                return <SettingsPage onBack={handleBack} />;
            default:
                return <HomePage 
                    onInitiateTestView={handleInitiateTestView} 
                    onShowInstructions={handleShowInstructions}
                    categories={categories} 
                    loadingCategories={loadingCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    currentAffairsSections={currentAffairsSections}
                    onSelectCurrentAffairsSection={handleSelectCurrentAffairsSection}
                    selectedCurrentAffairsSection={selectedCurrentAffairsSection}
                    searchQuery={searchQuery}
                    onNavigate={handleNavigation}
                    onOpenAuthModal={(initialView = 'signup') => setAuthModalState({ isOpen: true, initialView })}
                />;
        }
    };

    return (
        <AuthContext.Provider value={{ user, userProfile }}>
            {activeTestData || testForInstructions ? (
                 <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
                    {renderView()}
                </div>
            ) : (
                <div className={`flex flex-col min-h-screen ${isAdminView ? 'bg-slate-50 dark:bg-gray-900' : 'bg-white dark:bg-slate-900'}`}>
                    <Header 
                        onNavigate={handleNavigation} 
                        onMenuClick={() => setIsMobileMenuOpen(true)} 
                        isAdminView={isAdminView}
                        onSwitchToUserView={handleSwitchToUserView}
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                        notifications={notifications}
                        onOpenChat={() => setIsChatModalOpen(true)}
                        onMarkAsRead={handleMarkAsRead}
                        onNotificationClick={handleNotificationClick}
                        onOpenAuthModal={() => setAuthModalState({ isOpen: true, initialView: 'signin' })}
                    />
                    {!isAdminView && <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigation} />}
                    <MobileMenu 
                        isOpen={isMobileMenuOpen} 
                        onClose={() => setIsMobileMenuOpen(false)}
                        categories={categories}
                        loading={loadingCategories}
                        onSelectCategory={handleSelectCategory}
                        onNavigate={handleNavigation}
                    />
                    <main className="flex-grow">
                        {renderView()}
                    </main>
                    {!isAdminView && <Footer onNavigate={handleNavigation} links={footerLinks} />}
                    <NotificationDetailModal 
                        isOpen={!!notificationToShow}
                        onClose={() => setNotificationToShow(null)}
                        notification={notificationToShow}
                    />
                    <ChatModal
                        isOpen={isChatModalOpen}
                        onClose={() => setIsChatModalOpen(false)}
                    />
                    <AuthModal
                        isOpen={authModalState.isOpen}
                        initialView={authModalState.initialView}
                        onClose={() => setAuthModalState({ isOpen: false, initialView: 'signin' })}
                    />
                </div>
            )}
        </AuthContext.Provider>
    );
};

export default App;