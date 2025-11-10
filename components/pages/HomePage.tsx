import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc, limit, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Category, Test, UserResult, TestStateLocal, HomepageSettings, HomeComponent, BannerComponentConfig, FeaturedCategoryComponentConfig, LatestTestsComponentConfig, CategoriesGridComponentConfig, RichTextComponentConfig, RecentTestsComponentConfig, Announcement, AnnouncementsComponentConfig, TestimonialsComponentConfig, StatsCounterComponentConfig, FAQComponentConfig, CTAComponentConfig, FAQ, SyllabusComponentConfig, NotesComponentConfig, InformationComponentConfig, NewAdditionsComponentConfig, RecommendedTestsComponentConfig, CountdownTimerComponentConfig, VideoEmbedComponentConfig, LeaderboardComponentConfig, ImageGalleryComponentConfig, FeaturedTutorsComponentConfig, CurrentAffairsSection, CurrentAffairsGridComponentConfig, TestGridComponentConfig, StudyMaterial, LatestUpdatesComponentConfig, UpdateArticle } from '../../types';
import { AuthContext } from '../../App';
import TestCard from '../home/TestCard';
import DesktopSidebar from '../layout/DesktopSidebar';
import { showMessage, getCategoryStyle, formatRelativeTime } from '../../utils/helpers';
import { Shield, ArrowRight, Star, Megaphone, X, Quote, ChevronDown, TrendingUp, HelpCircle, Info, Trophy, Users, Newspaper, BookCopy, File as FileIcon, Youtube } from 'lucide-react';
import SkeletonCard from '../skeletons/SkeletonCard';
import DynamicIcon from '../layout/DynamicIcon';
import SkeletonHomePage from '../skeletons/SkeletonHomePage';
import VideoPlayerModal from '../modals/VideoPlayerModal';

interface HomePageProps {
    onInitiateTestView: (details: { test: Test; action: 'resume' | 'result'; resultData?: UserResult, language: 'english' | 'hindi' }) => void;
    onShowInstructions: (test: Test) => void;
    categories: Category[];
    loadingCategories: boolean;
    selectedCategory: { id: string, name: string };
    onSelectCategory: (category: { id: string, name: string }) => void;
    currentAffairsSections: CurrentAffairsSection[];
    onSelectCurrentAffairsSection: (section: { id: string, name: string }) => void;
    selectedCurrentAffairsSection: { id: string, name: string };
    searchQuery: string;
    onNavigate: (view: string) => void;
    onOpenAuthModal: (initialView?: 'signin' | 'signup') => void;
    isPreview?: boolean;
    previewHomepageSettings?: HomepageSettings | null;
    previewCategorySettings?: HomepageSettings | null;
}

const FAQComponent: React.FC<{ config: FAQComponentConfig }> = ({ config }) => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    return (
         <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">{config.title}</h2>
            <div className="max-w-3xl mx-auto space-y-4">
                {(config.faqs || []).map((f, i) => (
                    <div key={i} className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 dark:text-gray-100">
                            <span>{f.question}</span>
                            <ChevronDown className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaq === i && <div className="p-4 border-t dark:border-gray-700 text-gray-600 dark:text-gray-300 animate-fade-in">{f.answer}</div>}
                    </div>
                ))}
            </div>
        </section>
    );
};

const CountdownTimerComponent: React.FC<{ config: CountdownTimerComponentConfig }> = ({ config }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(config.targetDate) - +new Date();
        let timeLeft: { [key: string]: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [config.targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => (
        <div key={interval} className="text-center p-2">
            <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{String(value).padStart(2, '0')}</div>
            <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mt-1">{interval}</div>
        </div>
    ));

    return (
        <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border dark:border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{config.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{config.eventDescription}</p>
            <div className="flex justify-center flex-wrap gap-4 sm:gap-8">
                {timerComponents.length ? timerComponents : <span className="text-xl font-semibold text-green-600 dark:text-green-400">The event has started!</span>}
            </div>
        </section>
    );
};

const LatestUpdatesComponent: React.FC<{ config: LatestUpdatesComponentConfig; onNavigate: (path: string) => void }> = ({ config, onNavigate }) => {
    const [articles, setArticles] = useState<UpdateArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'updateArticles'), 
            where('status', '==', 'published')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const articlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UpdateArticle));
            articlesData.sort((a, b) => (b.publishAt?.toDate().getTime() || 0) - (a.publishAt?.toDate().getTime() || 0));
            setArticles(articlesData.slice(0, config.limit || 3));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching latest updates:", error);
            setLoading(false);
        });
        return unsubscribe;
    }, [config.limit]);
    
    const getSnippet = (content: string) => {
        const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 80 ? text.substring(0, 80) + '...' : text;
    };

    if (loading && articles.length === 0) {
        return (
            <section>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                         <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 animate-pulse">
                            <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-t-xl"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
    
    if (articles.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => (
                    <button key={article.id} onClick={() => onNavigate(`update/${article.slug}`)} className="text-left bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                        <img src={article.featuredImageUrl || `https://via.placeholder.com/400x200.png?text=${article.title.split(' ').join('+')}`} alt={article.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(article.publishAt)}</p>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mt-1 truncate">{article.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{getSnippet(article.content)}</p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

const HomePage: React.FC<HomePageProps> = ({ 
    onInitiateTestView,
    onShowInstructions,
    categories, 
    loadingCategories, 
    selectedCategory, 
    onSelectCategory,
    currentAffairsSections,
    onSelectCurrentAffairsSection,
    selectedCurrentAffairsSection,
    searchQuery,
    onNavigate,
    onOpenAuthModal,
    isPreview = false,
    previewHomepageSettings,
    previewCategorySettings
}) => {
    const { user, userProfile } = useContext(AuthContext);
    const [allTests, setAllTests] = useState<Test[]>([]);
    const [userResults, setUserResults] = useState<UserResult[]>([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [inProgressTest, setInProgressTest] = useState<TestStateLocal | null>(null);
    const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);
    const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
    
    const [sections, setSections] = useState<string[]>([]);
    const [selectedSection, setSelectedSection] = useState('All');

    const [recommendedTests, setRecommendedTests] = useState<Test[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);

    const [leaderboardData, setLeaderboardData] = useState<{name: string, score: number}[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

    const [categorySettings, setCategorySettings] = useState<HomepageSettings | null>(null);
    const [loadingCategorySettings, setLoadingCategorySettings] = useState(false);

    const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
    const [loadingStudyMaterials, setLoadingStudyMaterials] = useState(false);
    const [videoToPlay, setVideoToPlay] = useState<string | null>(null);

     useEffect(() => {
        if (!selectedCategory.id || isPreview) {
            setStudyMaterials([]);
            return;
        }

        setLoadingStudyMaterials(true);
        let currentCat = categories.find(c => c.id === selectedCategory.id);
        let topLevelParent = currentCat;
        while (topLevelParent?.parentId) {
            topLevelParent = categories.find(c => c.id === topLevelParent.parentId);
        }

        if (topLevelParent) {
            const q = query(collection(db, 'studyMaterials'), where('categoryId', '==', topLevelParent.id));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
                materialsData.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
                setStudyMaterials(materialsData);
                setLoadingStudyMaterials(false);
            }, (error) => {
                console.error("Error fetching study materials:", error);
                setStudyMaterials([]);
                setLoadingStudyMaterials(false);
            });
            return () => unsubscribe();
        } else {
            setStudyMaterials([]);
            setLoadingStudyMaterials(false);
        }

    }, [selectedCategory.id, categories, isPreview]);

     useEffect(() => {
        if (isPreview) {
            setCategorySettings(previewCategorySettings || null);
            setLoadingCategorySettings(false);
            return;
        }

        if (selectedCategory.id) {
            setLoadingCategorySettings(true);
            const settingsDocRef = doc(db, 'categorySettings', selectedCategory.id);
            const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
                if (doc.exists()) {
                    setCategorySettings(doc.data() as HomepageSettings);
                } else {
                    setCategorySettings(null);
                }
                setLoadingCategorySettings(false);
            }, (error) => {
                console.error("Error fetching category settings:", error);
                setCategorySettings(null);
                setLoadingCategorySettings(false);
            });
            return () => unsubscribe();
        } else {
            setCategorySettings(null);
            setLoadingCategorySettings(false);
        }
    }, [selectedCategory.id, isPreview, previewCategorySettings]);

    useEffect(() => {
        const needsLeaderboard = homepageSettings?.layout.some(c => c.type === 'leaderboard' && c.enabled);
        if (!needsLeaderboard || isPreview) {
            setLoadingLeaderboard(false);
            return;
        }

        setLoadingLeaderboard(true);
        const resultsQuery = query(collection(db, 'results'));
        const unsubscribeResults = onSnapshot(resultsQuery, async (resultsSnapshot) => {
            const allResults = resultsSnapshot.docs.map(doc => doc.data() as UserResult);
            
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data().name]));

            const userScores = new Map<string, { totalPercentage: number, count: number }>();
            allResults.forEach(result => {
                if (result.userId) {
                    const current = userScores.get(result.userId) || { totalPercentage: 0, count: 0 };
                    current.totalPercentage += result.percentage;
                    current.count += 1;
                    userScores.set(result.userId, current);
                }
            });

            const calculatedLeaderboard = Array.from(userScores.entries()).map(([userId, data]) => ({
                name: usersMap.get(userId) || 'Anonymous',
                score: data.totalPercentage / data.count,
            }));

            calculatedLeaderboard.sort((a, b) => b.score - a.score);
            
            setLeaderboardData(calculatedLeaderboard);
            setLoadingLeaderboard(false);

        }, (error) => {
            console.error("Error fetching leaderboard data:", error);
            setLoadingLeaderboard(false);
        });

        return () => unsubscribeResults();
    }, [homepageSettings, isPreview]);

    useEffect(() => {
        if (isPreview) {
            setHomepageSettings(previewHomepageSettings || null);
            return; // Skip Firestore fetch in preview mode
        }

        const settingsDocRef = doc(db, 'uiSettings', 'homepage');
        const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
            if (doc.exists()) {
                setHomepageSettings(doc.data() as HomepageSettings);
            } else {
                setHomepageSettings({ layout: [
                    { id: 'default-banner', type: 'banner', enabled: true, config: { title: 'Master Your Exams', subtitle: 'Prepare effectively with high-quality online mock tests.', imageUrl: null } },
                    { id: 'default-latest', type: 'latest_tests', enabled: true, config: { title: 'Latest Tests', limit: 4 } }
                ]});
            }
        });
        
        const qAnnounce = query(collection(db, 'announcements'), where("isActive", "==", true), limit(1));
        const unsubscribeAnnounce = onSnapshot(qAnnounce, (snapshot) => {
            if (!snapshot.empty) {
                setActiveAnnouncement({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Announcement);
            } else {
                setActiveAnnouncement(null);
            }
        });

        return () => {
            unsubscribe();
            unsubscribeAnnounce();
        };
    }, [isPreview, previewHomepageSettings]);

    useEffect(() => {
        setSelectedSection('All');
        if (selectedCategory.id) {
            let currentCat = categories.find(c => c.id === selectedCategory.id);
            let topLevelParent = currentCat;
            while (topLevelParent?.parentId) {
                topLevelParent = categories.find(c => c.id === topLevelParent.parentId);
            }
            setSections(topLevelParent?.sections || []);
        } else {
            setSections([]);
        }
    }, [selectedCategory, categories]);

    useEffect(() => {
        const q = query(collection(db, 'tests'), where("status", "==", "published"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
            testsData.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
            setAllTests(testsData);
            setLoadingTests(false);
        }, (error) => {
            console.error("Error fetching tests:", error);
            showMessage("Error: Could not load tests.", true);
            setLoadingTests(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user && !isPreview) {
            const q = query(collection(db, 'results'), where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserResult));
                resultsData.sort((a, b) => {
                    const dateA = a.submittedAt instanceof Timestamp ? a.submittedAt.toDate().getTime() : 0;
                    const dateB = b.submittedAt instanceof Timestamp ? b.submittedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });
                setUserResults(resultsData);
            }, (error) => {
                console.error("Error fetching user results in HomePage:", error);
                showMessage("Could not load your recent activity.", true);
            });
            setInProgressTest(JSON.parse(localStorage.getItem(`inProgressTest_${user.uid}`) || 'null'));
            return () => unsubscribe();
        } else {
            setUserResults([]);
            setInProgressTest(null);
        }
    }, [user, isPreview]);
    
    const isTestLive = (test: Test) => {
        const now = new Date();
        const publishDate = test.publishAt?.toDate();
        const expiryDate = test.expiresAt?.toDate();
        return (!publishDate || publishDate <= now) && (!expiryDate || expiryDate >= now);
    };
    
    const recentActivityTests = React.useMemo(() => {
        if (!user) return [];
        const activityTests: Test[] = [];
        const addedTestIds = new Set<string>();
        if (inProgressTest) {
            const test = allTests.find(t => t.id === inProgressTest.testId);
            if (test && isTestLive(test)) {
                activityTests.push(test);
                addedTestIds.add(test.id);
            }
        }
        if (userResults.length > 0) {
            for (const result of userResults) {
                if (!addedTestIds.has(result.testId)) {
                    const test = allTests.find(t => t.id === result.testId);
                    if (test) {
                        activityTests.push(test);
                        addedTestIds.add(test.id);
                    }
                }
                if (activityTests.length >= 8) break; 
            }
        }
        return activityTests;
    }, [user, inProgressTest, userResults, allTests]);

    useEffect(() => {
        if (!user || userResults.length === 0 || allTests.length === 0 || isPreview) {
            setRecommendedTests([]);
            setLoadingRecommendations(false);
            return;
        }
        setLoadingRecommendations(true);
        const categoryPerformance = new Map<string, { total: number; count: number; name: string }>();
        userResults.forEach(result => {
            const { categoryId, categoryName, percentage } = result;
            if (categoryId) {
                const current = categoryPerformance.get(categoryId) || { total: 0, count: 0, name: categoryName || '' };
                current.total += percentage;
                current.count += 1;
                categoryPerformance.set(categoryId, current);
            }
        });
        let weakestCategory: { id: string; avg: number } | null = null;
        categoryPerformance.forEach((data, id) => {
            const avg = data.total / data.count;
            if (!weakestCategory || avg < weakestCategory.avg) {
                weakestCategory = { id, avg };
            }
        });
        if (weakestCategory) {
            const takenTestIds = new Set(userResults.map(r => r.testId));
            const recommendations = allTests.filter(test => test.categoryId === weakestCategory!.id && !takenTestIds.has(test.id) && isTestLive(test)).slice(0, 4);
            setRecommendedTests(recommendations);
        } else {
            setRecommendedTests([]);
        }
        setLoadingRecommendations(false);
    }, [user, userResults, allTests, isPreview]);
    
    const handleTestAction = async (testId: string, action: 'start' | 'resume' | 'result') => {
        if (isPreview) {
            showMessage("Actions are disabled in preview mode.", true);
            return;
        }
        const test = allTests.find(t => t.id === testId);
        if (!test) return;
        if (action === 'start') {
            if (!user) {
                onOpenAuthModal('signup');
                return;
            }
            onShowInstructions(test);
        } else if (action === 'resume') {
            onInitiateTestView({ test, action: 'resume', language: 'english' });
        } else if (action === 'result') {
            const resultData = userResults.find(r => r.testId === testId);
            const testDoc = await getDoc(doc(db, 'tests', testId));
            if(testDoc.exists()) {
                onInitiateTestView({ test: {id: testDoc.id, ...testDoc.data()} as Test, action: 'result', resultData, language: 'english' });
            }
        }
    };

    const getCategoryAndAllChildrenIds = useCallback((categoryId: string): string[] => {
        let ids = [categoryId];
        categories.filter(c => c.parentId === categoryId).forEach(child => {
            ids = ids.concat(getCategoryAndAllChildrenIds(child.id));
        });
        return ids;
    }, [categories]);

    const getCASectionAndAllChildrenIds = useCallback((sectionId: string): string[] => {
        let ids = [sectionId];
        currentAffairsSections.filter(c => c.parentId === sectionId).forEach(child => {
            ids = ids.concat(getCASectionAndAllChildrenIds(child.id));
        });
        return ids;
    }, [currentAffairsSections]);
    
    const testsFilteredByCategoryAndSearch = React.useMemo(() => {
        return allTests.filter(test => {
            if (!isTestLive(test)) return false;
            
            let categoryMatch = true;
            if (selectedCategory.id) {
                const relevantIds = getCategoryAndAllChildrenIds(selectedCategory.id);
                categoryMatch = !!test.categoryId && relevantIds.includes(test.categoryId);
            } else if (selectedCurrentAffairsSection.id) {
                const relevantIds = getCASectionAndAllChildrenIds(selectedCurrentAffairsSection.id);
                categoryMatch = !!test.currentAffairsSectionId && relevantIds.includes(test.currentAffairsSectionId);
            }

            const searchMatch = searchQuery ? test.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            return categoryMatch && searchMatch;
        });
    }, [allTests, selectedCategory, selectedCurrentAffairsSection, getCategoryAndAllChildrenIds, getCASectionAndAllChildrenIds, searchQuery]);

    const sectionCounts = React.useMemo(() => {
        const counts: { [key: string]: number } = { 'All': testsFilteredByCategoryAndSearch.length };
        sections.forEach(section => {
            counts[section] = testsFilteredByCategoryAndSearch.filter(test => test.section === section).length;
        });
        return counts;
    }, [testsFilteredByCategoryAndSearch, sections]);

    const filteredTests = React.useMemo(() => {
        if (selectedSection === 'All') {
            return testsFilteredByCategoryAndSearch;
        }
        return testsFilteredByCategoryAndSearch.filter(test => test.section === selectedSection);
    }, [testsFilteredByCategoryAndSearch, selectedSection]);

    const renderTestGrid = (testsToRender: Test[], emptyMessage: string, markAsNew = false) => (
        loadingTests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {testsToRender.length > 0 ? (
                    testsToRender.map(test => (
                        <TestCard
                            key={test.id}
                            test={test}
                            userResult={userResults.find(r => r.testId === test.id)}
                            inProgressTest={inProgressTest?.testId === test.id ? inProgressTest : null}
                            onAction={handleTestAction}
                            isNew={markAsNew}
                        />
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 col-span-full mt-4">{emptyMessage}</p>
                )}
            </div>
        )
    );
    
    const renderHorizontalTestScroll = (testsToRender: Test[], emptyMessage: string) => (
        loadingTests && testsToRender.length === 0 ? (
            <div className="flex space-x-6">
                {Array.from({ length: 2 }).map((_, index) => <div className="w-72 flex-shrink-0" key={index}><SkeletonCard /></div>)}
            </div>
        ) : (
            <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {testsToRender.length > 0 ? (
                    testsToRender.map(test => (
                        <div key={test.id} className="w-72 flex-shrink-0">
                            <TestCard
                                test={test}
                                userResult={userResults.find(r => r.testId === test.id)}
                                inProgressTest={inProgressTest?.testId === test.id ? inProgressTest : null}
                                onAction={handleTestAction}
                            />
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 mt-4">{emptyMessage}</p>
                )}
            </div>
        )
    );

    const AnnouncementsComponent: React.FC = () => {
        const [isDismissed, setIsDismissed] = useState(false);
    
        useEffect(() => {
            if (activeAnnouncement) {
                const dismissed = sessionStorage.getItem(`announcement_dismissed_${activeAnnouncement.id}`) === 'true';
                setIsDismissed(dismissed);
            }
        }, [activeAnnouncement]);
    
        if (!activeAnnouncement || isDismissed) return null;
    
        const handleDismiss = () => {
            sessionStorage.setItem(`announcement_dismissed_${activeAnnouncement.id}`, 'true');
            setIsDismissed(true);
        };
    
        return (
            <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                    <Megaphone />
                    <div>
                        <h3 className="font-bold">{activeAnnouncement.title}</h3>
                        <p className="text-sm opacity-90">{activeAnnouncement.content}</p>
                    </div>
                </div>
                <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-white/20"><X size={18} /></button>
            </div>
        );
    };

    const renderStudyMaterials = () => (
        <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                <BookCopy /> Study Materials
            </h2>
            {loadingStudyMaterials ? (
                <div className="space-y-4">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-full"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-full"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {studyMaterials.map(material => (
                        <div key={material.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {material.type === 'pdf' ? <FileIcon className="w-8 h-8 text-red-500 flex-shrink-0 mt-1"/> : <Youtube className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1"/>}
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{material.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{material.description}</p>
                                </div>
                            </div>
                            {material.type === 'pdf' ? (
                                <a href={material.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition whitespace-nowrap">View PDF</a>
                            ) : (
                                <button onClick={() => setVideoToPlay(material.url)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition whitespace-nowrap">Watch Video</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    const renderCategoryTestArea = () => (
        <>
            {studyMaterials.length > 0 && !loadingStudyMaterials && (
                <div className="mb-12">
                    {renderStudyMaterials()}
                </div>
            )}
            {sections.length > 0 && selectedCategory.id && (
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {['All', ...sections].map(section => (
                        <button key={section} onClick={() => setSelectedSection(section)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${selectedSection === section ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent'}`}>
                            {section}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedSection === section ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                                {sectionCounts[section] || 0}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            {renderTestGrid(filteredTests, "No available tests found matching your criteria.")}
        </>
    );

    const renderHomepageComponent = (component: HomeComponent, testsForGrid: Test[] = []) => {
        if (!component.enabled) return null;
        
        switch (component.type) {
            case 'banner': {
                const config = component.config as BannerComponentConfig;
                return (
                    <section className="p-6 sm:p-8 rounded-xl shadow-lg text-center border-t-4 border-indigo-500 bg-cover bg-center text-white relative overflow-hidden bg-white dark:bg-gray-800" style={{ backgroundImage: config.imageUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.imageUrl})` : 'none' }}>
                         <div className="relative z-10">
                            <h1 className={`text-2xl sm:text-3xl font-extrabold mb-4 ${config.imageUrl ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{config.title}</h1>
                            <p className={`text-lg mb-6 max-w-2xl mx-auto ${config.imageUrl ? 'text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}>{config.subtitle}</p>
                        </div>
                    </section>
                );
            }
            case 'latest_updates': {
                const config = component.config as LatestUpdatesComponentConfig;
                return <LatestUpdatesComponent config={config} onNavigate={onNavigate} />;
            }
            case 'test_grid': {
                const config = component.config as TestGridComponentConfig;
                return (
                    <section>
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title || 'Tests'}</h2>
                         {renderCategoryTestArea()}
                    </section>
                );
            }
            case 'announcements': return <AnnouncementsComponent />;
            case 'latest_tests': {
                const config = component.config as LatestTestsComponentConfig;
                const tests = allTests.filter(t => isTestLive(t) && !t.currentAffairsSectionId).slice(0, config.limit);
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        {renderTestGrid(tests, "No new tests available at the moment.")}
                    </section>
                );
            }
            case 'new_additions': {
                const config = component.config as NewAdditionsComponentConfig;
                const tests = allTests.filter(t => isTestLive(t) && !t.currentAffairsSectionId).slice(0, config.limit);
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        {renderTestGrid(tests, "No new items have been added recently.", true)}
                    </section>
                );
            }
            case 'recent_tests': {
                if (!user) return null;
                const config = component.config as RecentTestsComponentConfig;
                const testsToDisplay = recentActivityTests.slice(0, config.limit);
                if (testsToDisplay.length === 0 && !loadingTests) return null;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        {renderHorizontalTestScroll(testsToDisplay, "You have no recent activity.")}
                    </section>
                );
            }
            case 'featured_category': {
                const config = component.config as FeaturedCategoryComponentConfig;
                if (!config.categoryId) return null;
                const tests = allTests.filter(t => isTestLive(t) && t.categoryId === config.categoryId);
                const category = categories.find(c => c.id === config.categoryId);
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title || `Featured: ${category?.name}`}</h2>
                        {renderTestGrid(tests, "No tests available in this featured category.")}
                    </section>
                );
            }
            case 'categories_grid': {
                const config = component.config as CategoriesGridComponentConfig;
                const topLevelCategories = categories.filter(c => !c.parentId);
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {topLevelCategories.map(cat => {
                                const style = getCategoryStyle(cat.name);
                                return (
                                <button key={cat.id} onClick={() => onSelectCategory({ id: cat.id, name: cat.name })} className="block p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-center group">
                                    <div className={`w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white dark:border-gray-800 shadow-md transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center ${style.bg} ${style.text}`}>
                                        <DynamicIcon name={cat.icon || cat.name} className="w-10 h-10" />
                                    </div>
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{cat.name}</p>
                                </button>
                            )})}
                        </div>
                    </section>
                );
            }
            case 'current_affairs_grid': {
                const config = component.config as CurrentAffairsGridComponentConfig;
                const topLevelSections = currentAffairsSections.filter(s => !s.parentId);
                 if (topLevelSections.length === 0) return null;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {topLevelSections.map(sec => {
                                const style = getCategoryStyle(sec.name);
                                return (
                                <button key={sec.id} onClick={() => onSelectCurrentAffairsSection({ id: sec.id, name: sec.name })} className="block p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all text-center group">
                                    <div className={`w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white dark:border-gray-800 shadow-md transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center ${style.bg} ${style.text}`}>
                                        <DynamicIcon name={sec.icon || sec.name} className="w-10 h-10" />
                                    </div>
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{sec.name}</p>
                                </button>
                            )})}
                        </div>
                    </section>
                );
            }
            case 'testimonials': {
                const config = component.config as TestimonialsComponentConfig;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">{config.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {(config.testimonials || []).map((t, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
                                    <Quote className="text-indigo-200 dark:text-indigo-700" size={32}/>
                                    <p className="text-gray-600 dark:text-gray-300 my-4 italic">"{t.text}"</p>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{t.author}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            }
            case 'stats_counter': {
                const config = component.config as StatsCounterComponentConfig;
                return (
                    <section className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700">
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">{config.title}</h2>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                             {(config.stats || []).map((s, i) => (
                                 <div key={i}>
                                     <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{s.value}</p>
                                     <p className="text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                                 </div>
                             ))}
                         </div>
                    </section>
                );
            }
            case 'faq': {
                const config = component.config as FAQComponentConfig;
                return <FAQComponent config={config} />;
            }
            case 'cta': {
                const config = component.config as CTAComponentConfig;
                const isExternal = config.buttonLink.startsWith('http');
                return (
                    <section className="bg-indigo-700 text-white p-8 rounded-xl shadow-lg text-center">
                        <h2 className="text-3xl font-extrabold">{config.headline}</h2>
                        <p className="mt-2 text-indigo-200 max-w-2xl mx-auto">{config.description}</p>
                        <button onClick={() => isExternal ? window.open(config.buttonLink, '_blank') : onNavigate(config.buttonLink)} className="mt-6 px-8 py-3 bg-white text-indigo-700 font-bold rounded-lg shadow-md hover:bg-gray-200 transition">
                            {config.buttonText}
                        </button>
                    </section>
                );
            }
            case 'rich_text': {
                const config = component.config as RichTextComponentConfig;
                return (
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
                        <div className="prose prose-indigo dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: config.content }} />
                    </section>
                );
            }
            case 'syllabus':
            case 'notes':
            case 'information': {
                const config = component.config as (SyllabusComponentConfig | NotesComponentConfig | InformationComponentConfig);
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                           <Info /> {config.title}
                        </h2>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
                            <div className="prose prose-indigo dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: config.content }} />
                        </div>
                    </section>
                );
            }
            case 'recommended_tests': {
                if (!user) return null;
                const config = component.config as RecommendedTestsComponentConfig;
                const testsToDisplay = recommendedTests.slice(0, config.limit);
                if (loadingRecommendations || testsToDisplay.length === 0) return null;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                            <Star className="text-amber-500" /> {config.title}
                        </h2>
                         <p className="text-gray-600 dark:text-gray-300 -mt-4 mb-6">Based on your performance, you might want to try these tests to improve.</p>
                        {renderTestGrid(testsToDisplay, "No recommendations available right now.")}
                    </section>
                );
            }
            case 'countdown_timer': {
                const config = component.config as CountdownTimerComponentConfig;
                return <CountdownTimerComponent config={config} />;
            }
            case 'video_embed': {
                const config = component.config as VideoEmbedComponentConfig;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${config.youtubeVideoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </section>
                );
            }
            case 'leaderboard': {
                const config = component.config as LeaderboardComponentConfig;
                const topPerformers = leaderboardData.slice(0, config.limit);
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3"><Trophy className="text-amber-500" /> {config.title}</h2>
                        {loadingLeaderboard ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                        <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topPerformers.map((user, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                                        <span className={`font-bold text-lg w-8 text-center ${index < 3 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>{index + 1}</span>
                                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">{user.name.charAt(0)}</div>
                                        <span className="font-semibold text-gray-800 dark:text-gray-100 flex-1">{user.name}</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{user.score.toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                );
            }
            case 'image_gallery': {
                const config = component.config as ImageGalleryComponentConfig;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {(config.images || []).map((image, index) => (
                                <div key={index} className="group relative overflow-hidden rounded-lg shadow-lg">
                                    <img src={image.src} alt={image.alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                    {image.caption && <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">{image.caption}</div>}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            }
            case 'featured_tutors': {
                const config = component.config as FeaturedTutorsComponentConfig;
                return (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{config.title}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {(config.tutors || []).map((tutor, index) => (
                                <div key={index} className="text-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
                                    <img src={tutor.imageUrl} alt={tutor.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-200" />
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{tutor.name}</h4>
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">{tutor.specialty}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            }
            default: return null;
        }
    };
    
    const currentFilterName = searchQuery ? `Search results for "${searchQuery}"` : selectedCategory.id ? `${selectedCategory.name} Tests` : selectedCurrentAffairsSection.id ? `${selectedCurrentAffairsSection.name}` : `All Tests`;

    const isShowingFilteredView = searchQuery || selectedCategory.id || selectedCurrentAffairsSection.id;

    const isInitialLoad = homepageSettings === null && !isShowingFilteredView;

    if (isInitialLoad && !isPreview) {
        return <SkeletonHomePage />;
    }

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col lg:flex-row gap-8">
                <DesktopSidebar 
                    categories={categories}
                    loading={loadingCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={onSelectCategory}
                    onNavigate={onNavigate}
                />
                <div className="flex-1 space-y-12">
                     {userProfile?.role === 'admin' && !isPreview && (
                        <div className="bg-indigo-50 dark:bg-gray-800 border-2 border-dashed border-indigo-200 dark:border-gray-700 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Shield className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Admin Controls</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Access the dashboard to manage the application.</p>
                                </div>
                            </div>
                            <button onClick={() => onNavigate('admin')} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 shrink-0">
                                Go to Dashboard <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                    
                    {!isShowingFilteredView && (homepageSettings?.layout || []).map(comp => 
                        <React.Fragment key={comp.id}>{renderHomepageComponent(comp)}</React.Fragment>
                    )}

                    {isShowingFilteredView && (
                        <section>
                             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 border-b dark:border-gray-700 pb-3">{currentFilterName}</h2>
                             
                            <div className="mt-6">
                                {loadingCategorySettings ? <SkeletonHomePage /> :
                                categorySettings && categorySettings.layout && categorySettings.layout.length > 0 ? (
                                    <div className="space-y-12">
                                        {(categorySettings.layout || []).map(comp =>
                                            <React.Fragment key={comp.id}>{renderHomepageComponent(comp, filteredTests)}</React.Fragment>
                                        )}
                                        {!(categorySettings.layout || []).some(c => c.type === 'test_grid' && c.enabled) && (
                                            renderCategoryTestArea()
                                        )}
                                    </div>
                                ) : (
                                    renderCategoryTestArea()
                                )
                                }
                            </div>
                        </section>
                    )}
                </div>
            </div>
             <VideoPlayerModal isOpen={!!videoToPlay} onClose={() => setVideoToPlay(null)} videoUrl={videoToPlay} />
        </div>
    );
};

export default HomePage;
