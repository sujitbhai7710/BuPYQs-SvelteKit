<script lang="ts">
  import {
    GraduationCap,
    FileText,
    BookOpen,
    Layers,
    Sparkles,
    FolderOpen,
    ExternalLink,
    Search,
    Calendar,
    Download,
    ChevronRight,
    ArrowLeft,
    Zap,
    Globe,
    BookMarked,
    Menu,
    X
  } from 'lucide-svelte';
  import type {
    FileEntry,
    QuestionData,
    SyllabusData,
    SemesterData,
    SystemData,
    TypeData
  } from '$lib/types.js';
  import { Step } from '$lib/types.js';
  import {
    subjectEmojis,
    syllabusEmojis,
    countFiles,
    getAllFiles,
    sortSyllabusEntries,
    getDirectDownloadUrl,
    getShortSemesterName
  } from '$lib/data.js';

  // ---- State ----
  let data = $state<QuestionData | null>(null);
  let syllabusData = $state<SyllabusData | null>(null);
  let loading = $state(true);
  let activeTab = $state<'pyq' | 'syllabus'>('pyq');
  let currentStep = $state<Step>(Step.SUBJECT);
  let selectedSubject = $state('');
  let selectedSystem = $state('');
  let selectedType = $state('');
  let selectedSemester = $state('');
  let searchQuery = $state('');
  let syllabusSearch = $state('');
  let mobileMenu = $state(false);

  // Toast state
  let toasts = $state<{ id: number; title: string; description: string; exiting?: boolean }[]>([]);
  let toastId = 0;

  function showToast(title: string, description: string) {
    const id = ++toastId;
    toasts = [...toasts, { id, title, description }];
    setTimeout(() => {
      toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
      }, 300);
    }, 2500);
  }

  // ---- Load data ----
  $effect(() => {
    Promise.all([
      fetch('/data/website_data.json').then((r) => r.json()),
      fetch('/data/syllabus_data.json').then((r) => r.json())
    ])
      .then(([qd, sd]) => {
        data = qd;
        syllabusData = sd;
        loading = false;
      })
      .catch(() => {
        loading = false;
      });
  });

  // ---- Derived state ----
  let subjects = $derived(data ? Object.keys(data).sort() : []);

  let systems = $derived(
    data?.[selectedSubject] ? Object.keys(data[selectedSubject].systems).sort() : []
  );

  let types = $derived.by(() => {
    const sys = data?.[selectedSubject]?.systems?.[selectedSystem];
    return sys ? Object.keys(sys.types).sort() : [];
  });

  let semesters = $derived.by(() => {
    const type = data?.[selectedSubject]?.systems?.[selectedSystem]?.types?.[selectedType];
    if (!type) return [];
    return Object.keys(type.semesters).sort(
      (a, b) => (type.semesters[a]?.number || 0) - (type.semesters[b]?.number || 0)
    );
  });

  let currentSemesterData = $derived(
    data?.[selectedSubject]?.systems?.[selectedSystem]?.types?.[selectedType]?.semesters?.[
      selectedSemester
    ] || null
  );

  let filteredSubjects = $derived(
    searchQuery
      ? subjects.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      : subjects
  );

  let filteredSyllabusSubjects = $derived.by(() => {
    if (!syllabusData) return [];
    const keys = Object.keys(syllabusData).sort();
    if (!syllabusSearch) return keys;
    return keys.filter((k) => k.toLowerCase().includes(syllabusSearch.toLowerCase()));
  });

  let breadcrumbs = $derived.by(() => {
    const items: { label: string; step: Step }[] = [];
    if (selectedSubject) items.push({ label: selectedSubject, step: Step.SUBJECT });
    if (selectedSystem) items.push({ label: selectedSystem, step: Step.SYSTEM });
    if (selectedType) items.push({ label: selectedType, step: Step.TYPE });
    if (selectedSemester) items.push({ label: getShortSemesterName(selectedSemester), step: Step.SEMESTER });
    return items;
  });

  let totalPapers = $derived.by(() => {
    if (!data) return 0;
    let c = 0;
    Object.values(data).forEach((s) =>
      Object.values(s.systems).forEach((sys) =>
        Object.values(sys.types).forEach((t) =>
          Object.values(t.semesters).forEach((sem) => {
            c += countFiles(sem);
          })
        )
      )
    );
    return c;
  });

  let totalSyllabus = $derived.by(() => {
    if (!syllabusData) return 0;
    return Object.values(syllabusData).reduce((a, b) => a + b.length, 0);
  });

  // ---- Navigation helpers ----
  function goToStep(step: Step) {
    currentStep = step;
    if (step <= Step.SUBJECT) {
      selectedSubject = '';
      selectedSystem = '';
      selectedType = '';
      selectedSemester = '';
    } else if (step <= Step.SYSTEM) {
      selectedSystem = '';
      selectedType = '';
      selectedSemester = '';
    } else if (step <= Step.TYPE) {
      selectedType = '';
      selectedSemester = '';
    } else if (step <= Step.SEMESTER) {
      selectedSemester = '';
    }
  }

  function goBack() {
    if (currentStep > Step.SUBJECT) goToStep(currentStep - 1);
  }

  function selectSubject(n: string) {
    selectedSubject = n;
    selectedSystem = '';
    selectedType = '';
    selectedSemester = '';
    currentStep = Step.SYSTEM;
  }

  function selectSystem(n: string) {
    selectedSystem = n;
    selectedType = '';
    selectedSemester = '';
    currentStep = Step.TYPE;
  }

  function selectType(n: string) {
    selectedType = n;
    selectedSemester = '';
    currentStep = Step.SEMESTER;
  }

  function selectSemester(n: string) {
    selectedSemester = n;
    currentStep = Step.FILES;
  }

  function handleDownload(file: FileEntry) {
    if (file.url) {
      const downloadUrl = getDirectDownloadUrl(file.url);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Downloading...', file.name);
    }
  }

  function handleFolderOpen(url: string) {
    if (url) window.open(url, '_blank');
  }

  function switchTab(tab: 'pyq' | 'syllabus') {
    activeTab = tab;
    goToStep(Step.SUBJECT);
    mobileMenu = false;
  }

  // Helper to count files for a subject
  function getSubjectFileCount(name: string): number {
    const subject = data?.[name];
    let fileCount = 0;
    Object.values(subject?.systems || {}).forEach((sys: SystemData) =>
      Object.values(sys.types).forEach((t: TypeData) =>
        Object.values(t.semesters).forEach((sem: SemesterData) => {
          fileCount += countFiles(sem);
        })
      )
    );
    return fileCount;
  }

  function getSystemFileCount(sysData: SystemData | undefined): number {
    let fileCount = 0;
    Object.values(sysData?.types || {}).forEach((t: TypeData) =>
      Object.values(t.semesters).forEach((sem: SemesterData) => {
        fileCount += countFiles(sem);
      })
    );
    return fileCount;
  }

  function getTypeFileCount(typeData: TypeData | undefined): number {
    let fileCount = 0;
    Object.values(typeData?.semesters || {}).forEach((sem: SemesterData) => {
      fileCount += countFiles(sem);
    });
    return fileCount;
  }

  // Step indicator data
  const stepInfo = [
    { s: Step.SUBJECT, l: 'Subject' },
    { s: Step.SYSTEM, l: 'System' },
    { s: Step.TYPE, l: 'Type' },
    { s: Step.SEMESTER, l: 'Semester' },
    { s: Step.FILES, l: 'Papers' }
  ];

  // Wave divider clip paths
  const pyqWaveClip =
    'polygon(0 100%, 0 60%, 2% 55%, 5% 50%, 10% 48%, 15% 50%, 20% 55%, 25% 52%, 30% 48%, 35% 45%, 40% 48%, 45% 52%, 50% 50%, 55% 47%, 60% 45%, 65% 48%, 70% 52%, 75% 50%, 80% 46%, 85% 44%, 90% 48%, 95% 52%, 98% 55%, 100% 60%, 100% 100%)';
  const syllabusWaveClip =
    'polygon(0 100%, 0 60%, 3% 55%, 8% 50%, 15% 48%, 25% 52%, 35% 48%, 45% 45%, 55% 48%, 65% 52%, 75% 48%, 85% 45%, 92% 50%, 97% 55%, 100% 60%, 100% 100%)';
</script>

{#if loading}
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-950"
  >
    <div class="text-center">
      <div
        class="animate-spin h-14 w-14 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"
      ></div>
      <p class="text-teal-200 text-lg font-medium">Loading BuPYQs...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- NAVBAR -->
    <nav class="sticky top-0 z-50 bg-teal-900 shadow-xl">
      <div class="max-w-6xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <button onclick={() => switchTab('pyq')} class="flex items-center gap-2.5 group">
            <div
              class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
            >
              <GraduationCap class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-extrabold text-white tracking-tight">BuPYQs</h1>
              <p class="text-[10px] text-teal-300 -mt-0.5">Burdwan University</p>
            </div>
          </button>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            <button
              onclick={() => switchTab('pyq')}
              class="text-sm px-3 py-1.5 rounded-md transition-colors {activeTab === 'pyq'
                ? 'bg-teal-800 text-white'
                : 'text-teal-100 hover:text-white hover:bg-teal-800'}"
            >
              <span class="flex items-center gap-1.5"><FileText class="w-4 h-4" />Question Papers</span>
            </button>
            <button
              onclick={() => switchTab('syllabus')}
              class="text-sm px-3 py-1.5 rounded-md transition-colors {activeTab === 'syllabus'
                ? 'bg-teal-800 text-white'
                : 'text-teal-100 hover:text-white hover:bg-teal-800'}"
            >
              <span class="flex items-center gap-1.5"
                ><BookMarked class="w-4 h-4" />Syllabus</span
              >
            </button>
            <a href="https://www.buruniv.ac.in" target="_blank" rel="noopener noreferrer">
              <button
                class="text-sm px-3 py-1.5 rounded-md transition-colors text-teal-100 hover:text-white hover:bg-teal-800"
              >
                <span class="flex items-center gap-1.5"><Globe class="w-4 h-4" />University Site</span>
              </button>
            </a>
          </div>

          <!-- Mobile menu button -->
          <button
            onclick={() => (mobileMenu = !mobileMenu)}
            class="md:hidden text-teal-100 p-1.5 rounded-md hover:bg-teal-800"
          >
            {#if mobileMenu}
              <X class="w-5 h-5" />
            {:else}
              <Menu class="w-5 h-5" />
            {/if}
          </button>
        </div>

        <!-- Mobile menu -->
        {#if mobileMenu}
          <div class="md:hidden mt-3 pb-2 flex flex-col gap-1 border-t border-teal-700 pt-3">
            <button
              onclick={() => switchTab('pyq')}
              class="text-sm px-3 py-1.5 rounded-md transition-colors justify-start flex items-center gap-2 {activeTab ===
              'pyq'
                ? 'bg-teal-800 text-white'
                : 'text-teal-100 hover:text-white hover:bg-teal-800'}"
            >
              <FileText class="w-4 h-4" />Question Papers
            </button>
            <button
              onclick={() => switchTab('syllabus')}
              class="text-sm px-3 py-1.5 rounded-md transition-colors justify-start flex items-center gap-2 {activeTab ===
              'syllabus'
                ? 'bg-teal-800 text-white'
                : 'text-teal-100 hover:text-white hover:bg-teal-800'}"
            >
              <BookMarked class="w-4 h-4" />Syllabus
            </button>
          </div>
        {/if}
      </div>
    </nav>

    <main class="flex-1">
      <!-- ============= PYQ SECTION ============= -->
      {#if activeTab === 'pyq'}
        <div>
          <!-- Hero - only show at step 0 -->
          {#if currentStep === Step.SUBJECT}
            <section class="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white">
              <div class="max-w-6xl mx-auto px-4 py-12 md:py-16">
                <div class="text-center max-w-2xl mx-auto">
                  <span
                    class="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4 text-xs px-2.5 py-1 rounded-full"
                  >
                    <Zap class="w-3 h-3" /> Free & Instant Downloads
                  </span>
                  <h2 class="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
                    Burdwan University<br />
                    <span
                      class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400"
                    >
                      Previous Year Question Papers
                    </span>
                  </h2>
                  <p class="text-teal-200 text-sm md:text-base mb-8 leading-relaxed">
                    Download CBCS & CCFUP question papers for all BSc, BA & BCom subjects. Organized by
                    subject, system, type & semester for easy access.
                  </p>
                  <div class="flex items-center justify-center gap-6 md:gap-10 text-center">
                    <div>
                      <div class="text-2xl md:text-3xl font-extrabold text-amber-400">
                        {subjects.length}
                      </div>
                      <div class="text-xs text-teal-300 mt-0.5">Subjects</div>
                    </div>
                    <div class="w-px h-10 bg-teal-700"></div>
                    <div>
                      <div class="text-2xl md:text-3xl font-extrabold text-amber-400">
                        {totalPapers}+
                      </div>
                      <div class="text-xs text-teal-300 mt-0.5">Papers</div>
                    </div>
                    <div class="w-px h-10 bg-teal-700"></div>
                    <div>
                      <div class="text-2xl md:text-3xl font-extrabold text-amber-400">Free</div>
                      <div class="text-xs text-teal-300 mt-0.5">Forever</div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Wave divider -->
              <div class="h-8 bg-gray-50" style="clip-path: {pyqWaveClip}"></div>
            </section>
          {/if}

          <div class="max-w-6xl mx-auto px-4 py-4 md:py-6">
            <!-- Breadcrumbs -->
            {#if breadcrumbs.length > 0}
              <div class="mb-4 flex items-center gap-1.5 flex-wrap text-sm">
                <button
                  onclick={() => goToStep(Step.SUBJECT)}
                  class="text-teal-600 hover:text-teal-700 font-medium"
                  >All Subjects</button
                >
                {#each breadcrumbs as bc, i}
                  <div class="flex items-center gap-1.5">
                    <ChevronRight class="w-3.5 h-3.5 text-gray-400" />
                    <button
                      onclick={() => (i < breadcrumbs.length - 1 ? goToStep(bc.step + 1) : undefined)}
                      class="{i === breadcrumbs.length - 1
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-500 hover:text-teal-600'}"
                    >
                      {bc.label}
                    </button>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Step indicator -->
            {#if currentStep > Step.SUBJECT}
              <div class="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
                {#each stepInfo as st, i}
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    {#if i > 0}
                      <div class="w-5 h-0.5 {currentStep >= st.s ? 'bg-teal-500' : 'bg-gray-200'}"></div>
                    {/if}
                    <div
                      class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium {currentStep ===
                      st.s
                        ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-300'
                        : currentStep > st.s
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-400'}"
                    >
                      {#if currentStep > st.s}
                        <span>✓</span>
                      {:else}
                        <span>{st.s + 1}</span>
                      {/if}
                      <span class="hidden sm:inline">{st.l}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Back button -->
            {#if currentStep > Step.SUBJECT}
              <button
                onclick={goBack}
                class="mb-4 text-gray-500 hover:text-teal-600 -ml-2 text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 inline-flex items-center gap-1"
              >
                <ArrowLeft class="w-4 h-4" /> Back
              </button>
            {/if}

            <!-- STEP: SUBJECT -->
            {#if currentStep === Step.SUBJECT}
              <section>
                <div class="mb-5">
                  <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-1"
                    >Select Your Subject</h2
                  >
                  <p class="text-sm text-gray-500"
                    >Choose the subject you want question papers for</p
                  >
                </div>
                <div class="relative mb-5">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    bind:value={searchQuery}
                    class="pl-10 bg-white border border-gray-200 focus:border-teal-400 h-10 w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {#each filteredSubjects as name}
                    {@const fileCount = getSubjectFileCount(name)}
                    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                    <div
                      role="button"
                      tabindex="0"
                      onclick={() => selectSubject(name)}
                      onkeydown={(e) => e.key === 'Enter' && selectSubject(name)}
                      class="cursor-pointer hover:shadow-lg hover:shadow-teal-100 hover:border-teal-300 transition-all duration-200 group bg-white rounded-xl border border-gray-200 p-3 md:p-4 text-center"
                    >
                      <div class="text-2xl md:text-3xl mb-1.5">{subjectEmojis[name] || '📄'}</div>
                      <h3
                        class="font-semibold text-xs md:text-sm text-gray-900 group-hover:text-teal-700 transition-colors leading-tight"
                        >{name}</h3
                      >
                      <div class="flex items-center justify-center gap-1 mt-1.5 flex-wrap">
                        {#if fileCount > 0}
                          <span
                            class="text-[9px] px-1.5 py-0 bg-teal-100 text-teal-700 rounded-full"
                            >{fileCount}</span
                          >
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}

            <!-- STEP: SYSTEM -->
            {#if currentStep === Step.SYSTEM && selectedSubject}
              <section>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Select System for <span class="text-teal-600">{selectedSubject}</span>
                </h2>
                <p class="text-sm text-gray-500 mb-5">Choose CBCS or CCFUP curriculum system</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {#each systems as sysName}
                    {@const sysData = data?.[selectedSubject]?.systems[sysName]}
                    {@const typeCount = Object.keys(sysData?.types || {}).length}
                    {@const fileCount = getSystemFileCount(sysData)}
                    {@const isCBCS = sysName === 'CBCS'}
                    {@const isCCFUP = sysName === 'CCFUP'}
                    {@const isIDC = sysName === 'IDC/MDC'}
                    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                    <div
                      role="button"
                      tabindex="0"
                      onclick={() => selectSystem(sysName)}
                      onkeydown={(e) => e.key === 'Enter' && selectSystem(sysName)}
                      class="cursor-pointer hover:shadow-lg hover:shadow-teal-100 hover:border-teal-300 transition-all group bg-white rounded-xl border border-gray-200"
                    >
                      <div class="p-4 pb-2">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-11 h-11 rounded-xl flex items-center justify-center {isCBCS
                              ? 'bg-sky-100'
                              : isCCFUP
                                ? 'bg-amber-100'
                                : 'bg-purple-100'}"
                          >
                            {#if isCBCS}
                              <Layers class="w-5 h-5 text-sky-600" />
                            {:else if isCCFUP}
                              <Sparkles class="w-5 h-5 text-amber-600" />
                            {:else}
                              <BookOpen class="w-5 h-5 text-purple-600" />
                            {/if}
                          </div>
                          <div>
                            <h3
                              class="text-base font-semibold group-hover:text-teal-700 transition-colors"
                              >{sysName}</h3
                            >
                            <p class="text-xs text-gray-500"
                              >{isCBCS
                                ? 'Choice Based Credit System'
                                : isCCFUP
                                  ? 'Curriculum & Credit Framework for UG'
                                  : 'Interdisciplinary / Multidisciplinary Course'}</p
                            >
                          </div>
                        </div>
                      </div>
                      <div class="px-4 pb-4 pt-0">
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                          <span>{typeCount} categor{typeCount !== 1 ? 'ies' : 'y'}</span>
                          {#if fileCount > 0}
                            <span>·</span>
                            <span class="text-teal-600 font-medium">{fileCount} papers</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}

            <!-- STEP: TYPE -->
            {#if currentStep === Step.TYPE && selectedSubject && selectedSystem}
              <section>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                  Select Type for
                  <span class="text-teal-600">{selectedSubject} · {selectedSystem}</span>
                </h2>
                <p class="text-sm text-gray-500 mb-5">Choose General, Honours, or Programme</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {#each types as typeName}
                    {@const typeData = data?.[selectedSubject]?.systems[selectedSystem]?.types[typeName]}
                    {@const semCount = Object.keys(typeData?.semesters || {}).length}
                    {@const fileCount = getTypeFileCount(typeData)}
                    {@const isGen = typeName === 'General'}
                    {@const isHon = typeName === 'Honours'}
                    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                    <div
                      role="button"
                      tabindex="0"
                      onclick={() => selectType(typeName)}
                      onkeydown={(e) => e.key === 'Enter' && selectType(typeName)}
                      class="cursor-pointer hover:shadow-lg hover:shadow-teal-100 hover:border-teal-300 transition-all group bg-white rounded-xl border border-gray-200"
                    >
                      <div class="p-4 pb-2">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-11 h-11 rounded-xl flex items-center justify-center {isHon
                              ? 'bg-rose-100'
                              : isGen
                                ? 'bg-sky-100'
                                : 'bg-violet-100'}"
                          >
                            {#if isHon}
                              <GraduationCap class="w-5 h-5 text-rose-600" />
                            {:else if isGen}
                              <BookOpen class="w-5 h-5 text-sky-600" />
                            {:else}
                              <Layers class="w-5 h-5 text-violet-600" />
                            {/if}
                          </div>
                          <div>
                            <h3
                              class="text-base font-semibold group-hover:text-teal-700 transition-colors"
                              >{typeName}</h3
                            >
                            <p class="text-xs text-gray-500"
                              >{isHon
                                ? 'Honours / Major'
                                : isGen
                                  ? 'General / Pass'
                                  : 'Complete programme'}</p
                            >
                          </div>
                        </div>
                      </div>
                      <div class="px-4 pb-4 pt-0">
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                          <span>{semCount} semesters</span>
                          {#if fileCount > 0}
                            <span>·</span>
                            <span class="text-teal-600 font-medium">{fileCount} papers</span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}

            <!-- STEP: SEMESTER -->
            {#if currentStep === Step.SEMESTER && selectedSubject && selectedSystem && selectedType}
              <section>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-1">Select Semester</h2>
                <p class="text-sm text-gray-500 mb-5">
                  <span class="text-teal-600 font-medium">{selectedSubject}</span> · {selectedSystem} ·
                  {selectedType}
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {#each semesters as semName}
                    {@const semData = data?.[selectedSubject]?.systems[selectedSystem]?.types[selectedType]?.semesters[semName]}
                    {@const fileCount = semData ? countFiles(semData) : 0}
                    {@const yearCount = Object.keys(semData?.years || {}).length}
                    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                    <div
                      role="button"
                      tabindex="0"
                      onclick={() => selectSemester(semName)}
                      onkeydown={(e) => e.key === 'Enter' && selectSemester(semName)}
                      class="cursor-pointer hover:shadow-md hover:shadow-teal-50 hover:border-teal-300 transition-all group bg-white rounded-xl border border-gray-200 p-3 md:p-4"
                    >
                      <div class="flex items-center gap-2.5">
                        <div
                          class="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                          <span class="font-bold text-white text-sm"
                            >{(() => { const m = semName.match(/[IVXivx]+|\d+/); return m ? m[0].toUpperCase() : '?' })()}</span
                          >
                        </div>
                        <div class="min-w-0">
                          <h3
                            class="font-semibold text-xs md:text-sm text-gray-900 group-hover:text-teal-700 transition-colors"
                            >{getShortSemesterName(semName)}</h3
                          >
                          <div class="flex items-center gap-1 mt-0.5">
                            {#if fileCount > 0}
                              <span
                                class="text-[9px] px-1.5 py-0 bg-teal-100 text-teal-700 rounded-full"
                                >{fileCount} papers</span
                              >
                            {/if}
                            {#if yearCount > 0}
                              <span
                                class="text-[9px] px-1.5 py-0 border border-gray-200 text-gray-600 rounded-full"
                                >{yearCount} yr</span
                              >
                            {/if}
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
                {#if data?.[selectedSubject]?.systems[selectedSystem]?.types[selectedType]?.url}
                  <div
                    class="mt-5 bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2.5"
                  >
                    <FolderOpen class="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-teal-900"
                        >Browse all files on Google Drive</p
                      >
                      <p class="text-[11px] text-teal-600">Open the complete folder</p>
                    </div>
                    <button
                      onclick={() => handleFolderOpen(data[selectedSubject].systems[selectedSystem].types[selectedType].url)}
                      class="border border-teal-300 text-teal-700 hover:bg-teal-100 flex-shrink-0 text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1"
                    >
                      <ExternalLink class="w-3.5 h-3.5" /> Open
                    </button>
                  </div>
                {/if}
              </section>
            {/if}

            <!-- STEP: FILES -->
            {#if currentStep === Step.FILES && currentSemesterData}
              {@const allFiles = getAllFiles(currentSemesterData)}
              {@const hasFiles = allFiles.some((g) => g.files.length > 0)}
              {@const yearFolders = Object.entries(currentSemesterData.years)
                .filter(([_, yd]) => yd.url)
                .sort(([a], [b]) => b.localeCompare(a))}
              {@const emptyYearFolders = yearFolders.filter(([_, yd]) => yd.files.length === 0)}

              <section>
                <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-1">Question Papers</h2>
                <p class="text-sm text-gray-500 mb-5">
                  <span class="text-teal-600 font-medium">{selectedSubject}</span> · {selectedSystem} ·
                  {selectedType} · {getShortSemesterName(selectedSemester)}
                </p>

                {#if currentSemesterData.url}
                  <div
                    class="mb-5 bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2.5"
                  >
                    <FolderOpen class="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-teal-900"
                        >Browse all files on Google Drive</p
                      >
                      <p class="text-[11px] text-teal-600"
                        >Open the complete folder to see all papers</p
                      >
                    </div>
                    <button
                      onclick={() => handleFolderOpen(currentSemesterData.url)}
                      class="border border-teal-300 text-teal-700 hover:bg-teal-100 flex-shrink-0 text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1"
                    >
                      <ExternalLink class="w-3.5 h-3.5" /> Open Drive
                    </button>
                  </div>
                {/if}

                {#if !hasFiles && yearFolders.length === 0}
                  <div class="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
                    <FileText class="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 class="font-semibold text-gray-700 mb-1">No papers available</h3>
                    <p class="text-sm text-gray-400"
                      >Check back later or browse the Google Drive folder.</p
                    >
                  </div>
                {:else}
                  <div class="space-y-5">
                    <!-- Direct files grouped by year -->
                    {#each allFiles.filter((g) => g.files.length > 0) as { year, files }, idx}
                      <div>
                        {#if year}
                          <div class="flex items-center gap-2 mb-2">
                            <Calendar class="w-4 h-4 text-teal-600" />
                            <h3 class="font-semibold text-gray-900 text-sm">{year}</h3>
                            <span
                              class="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 rounded-full"
                              >{files.length}</span
                            >
                          </div>
                        {:else}
                          <div class="flex items-center gap-2 mb-2">
                            <FileText class="w-4 h-4 text-teal-600" />
                            <h3 class="font-semibold text-gray-900 text-sm">Available Papers</h3>
                            <span
                              class="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 rounded-full"
                              >{files.length}</span
                            >
                          </div>
                        {/if}
                        <div class="grid gap-2">
                          {#each files as file, fidx}
                            <div
                              class="bg-white hover:shadow-md transition-shadow group rounded-xl border border-gray-200 p-2.5 flex items-center gap-2.5"
                            >
                              <div
                                class="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0"
                              >
                                <FileText class="w-4 h-4 text-red-500" />
                              </div>
                              <div class="flex-1 min-w-0">
                                <p
                                  class="text-xs font-medium text-gray-900 truncate group-hover:text-teal-700 transition-colors"
                                  >{file.name}</p
                                >
                                <p class="text-[10px] text-gray-400">PDF Document</p>
                              </div>
                              <button
                                onclick={() => handleDownload(file)}
                                class="bg-teal-600 hover:bg-teal-700 flex-shrink-0 h-8 text-xs text-white px-2.5 rounded-md inline-flex items-center gap-1"
                              >
                                <Download class="w-3.5 h-3.5" /> Download
                              </button>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}

                    <!-- Year folders not yet fully indexed -->
                    {#if emptyYearFolders.length > 0}
                      <div>
                        <div class="flex items-center gap-2 mb-2">
                          <FolderOpen class="w-4 h-4 text-teal-600" />
                          <h3 class="font-semibold text-gray-900 text-sm">Browse by Year</h3>
                          <span
                            class="text-[10px] px-1.5 py-0 border border-gray-200 text-gray-600 rounded-full"
                            >{emptyYearFolders.length} folders</span
                          >
                        </div>
                        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {#each emptyYearFolders as [yearName, yearData]}
                            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                            <div
                              role="button"
                              tabindex="0"
                              onclick={() => handleFolderOpen(yearData.url)}
                              onkeydown={(e) => e.key === 'Enter' && handleFolderOpen(yearData.url)}
                              class="cursor-pointer hover:shadow-md hover:border-teal-300 transition-all bg-white rounded-xl border border-gray-200 p-2.5 text-center"
                            >
                              <Calendar class="w-4 h-4 text-teal-600 mx-auto mb-1" />
                              <p class="text-xs font-semibold text-gray-900">{yearName}</p>
                              <p class="text-[10px] text-gray-400">Open in Drive</p>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}
              </section>
            {/if}
          </div>
        </div>
      {/if}

      <!-- ============= SYLLABUS SECTION ============= -->
      {#if activeTab === 'syllabus'}
        <div>
          <!-- Hero -->
          <section
            class="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white"
          >
            <div class="max-w-6xl mx-auto px-4 py-12 md:py-16">
              <div class="text-center max-w-2xl mx-auto">
                <span
                  class="inline-flex items-center gap-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-4 text-xs px-2.5 py-1 rounded-full"
                >
                  <BookMarked class="w-3 h-3" /> Official Syllabi
                </span>
                <h2 class="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
                  Burdwan University<br />
                  <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-pink-400"
                  >
                    UG Syllabus Download
                  </span>
                </h2>
                <p class="text-indigo-200 text-sm md:text-base mb-8">
                  Download official syllabus for all UG programmes from the University of Burdwan. NEP,
                  CBCS and older curricula available.
                </p>
                <div class="flex items-center justify-center gap-8 text-center">
                  <div>
                    <div class="text-2xl font-extrabold text-violet-300">{totalSyllabus}</div>
                    <div class="text-xs text-indigo-300">Syllabi</div>
                  </div>
                  <div class="w-px h-10 bg-indigo-700"></div>
                  <div>
                    <div class="text-2xl font-extrabold text-violet-300"
                      >{filteredSyllabusSubjects.length}</div
                    >
                    <div class="text-xs text-indigo-300">Subjects</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="h-6 bg-gray-50" style="clip-path: {syllabusWaveClip}"></div>
          </section>

          <div class="max-w-6xl mx-auto px-4 py-6">
            <div class="relative mb-5">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search syllabus by subject..."
                bind:value={syllabusSearch}
                class="pl-10 bg-white border border-gray-200 focus:border-indigo-400 h-10 w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div class="space-y-6">
              {#each filteredSyllabusSubjects as subjName}
                {@const entries = syllabusData?.[subjName] || []}
                {#if entries.length > 0}
                  <div class="bg-white shadow-sm rounded-xl border border-gray-200">
                    <div class="p-4 pb-2">
                      <div class="flex items-center gap-2.5">
                        <div
                          class="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0"
                        >
                          <span class="text-lg">{syllabusEmojis[subjName] || '📄'}</span>
                        </div>
                        <div>
                          <h3 class="text-base font-semibold">{subjName}</h3>
                          <p class="text-xs text-gray-500"
                            >{entries.length} syllabus document{entries.length !== 1
                              ? 's'
                              : ''} available</p
                          >
                        </div>
                      </div>
                    </div>
                    <div class="px-4 pb-4">
                      <div class="grid gap-2 mt-1">
                        {#each sortSyllabusEntries(entries) as entry, idx}
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div
                              class="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0"
                            >
                              <FileText class="w-4 h-4 text-red-500" />
                            </div>
                            <div class="flex-1 min-w-0">
                              <p
                                class="text-xs font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors"
                                >{entry.name}</p
                              >
                              <span
                                class="text-[9px] px-1 py-0 border border-gray-200 text-gray-600 rounded-full mt-0.5 inline-block"
                                >{entry.category}</span
                              >
                            </div>
                            <Download
                              class="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors flex-shrink-0"
                            />
                          </a>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>

            <div class="mt-8 text-center">
              <p class="text-xs text-gray-400">
                Syllabi sourced from
                <a
                  href="https://www.buruniv.ac.in/Demo/Template.php?menu=Syllabus&submenu=UG"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-indigo-500 hover:underline"
                >
                  University of Burdwan Official Website
                </a>
              </p>
            </div>
          </div>
        </div>
      {/if}
    </main>

    <!-- FOOTER -->
    <footer class="mt-auto bg-gray-900 text-gray-400 py-8">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
              >
                <GraduationCap class="w-4 h-4 text-white" />
              </div>
              <span class="font-bold text-white">BuPYQs</span>
            </div>
            <p class="text-xs text-gray-500 leading-relaxed">
              Free previous year question paper & syllabus downloader for University of Burdwan
              students. All papers sourced from official channels.
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-white text-sm mb-2">Quick Links</h4>
            <div class="flex flex-col gap-1.5 text-xs">
              <a
                href="https://www.buruniv.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors">University of Burdwan</a
              >
              <a
                href="https://www.buruniv.ac.in/Demo/Template.php?menu=Syllabus&submenu=UG"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors">Official Syllabus Page</a
              >
              <a
                href="https://www.rmvonline.in/library/collect_question.php"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors">RMV Library (PYQ Source)</a
              >
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-white text-sm mb-2">About</h4>
            <p class="text-xs text-gray-500 leading-relaxed">
              This is an unofficial resource to help students access question papers easily. Not
              affiliated with University of Burdwan. All content belongs to respective owners.
            </p>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-4 text-center">
          <p class="text-[11px] text-gray-600"
            >© {new Date().getFullYear()} BuPYQs · Made for Burdwan University students · Created by
            Satwik Samanta</p
          >
        </div>
      </div>
    </footer>

    <!-- Toast notifications -->
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {#each toasts as toast (toast.id)}
        <div
          class="bg-white border border-gray-200 shadow-lg rounded-lg p-3 max-w-xs {toast.exiting
            ? 'toast-exit'
            : 'toast-enter'}"
        >
          <p class="text-sm font-medium text-gray-900">{toast.title}</p>
          <p class="text-xs text-gray-500 truncate">{toast.description}</p>
        </div>
      {/each}
    </div>
  </div>
{/if}
