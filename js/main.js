fetch("data.json").then(function(response){
    return response.json();
}).then(function(data){

    let model = new Model(data);
    let view = new View();

    let controller = new Controller(model, view);
    
})

    /* 
        MVC 
    */


    class Model{

        constructor(data){
            this.jobList = this.defineFilters(data);
            this.filtersList = [];
           
        }

        bindFiltersChanged(callback) {
            this.onFiltersChanged = callback;
        }

        addFilter(filter){

            for(let f of this.filtersList){
                if (f.filter === filter.filter)
                    return;
            }

            this.filtersList.push(filter);
            
            let jobs = this.getJobs();
            this.onFiltersChanged(this.filtersList, jobs);
            return jobs;
        }


        removeFilter(filter){
            this.filtersList = this.filtersList.filter(e => {
                return e.filter != filter.filter;
            })
        
            let jobs = this.getJobs();
            this.onFiltersChanged(this.filtersList, jobs);
            return jobs;

        }

        clearFilters(){
            this.filtersList.length = 0;
            
            let jobs = this.getJobs();
            this.onFiltersChanged(this.filtersList, jobs);
            return jobs;
        }

        getJobs(){
           
            return this.jobList.filter(e => {
                    
                    for (let filter of this.filtersList){
                        

                        if(typeof e[filter.type] === 'undefined'){
                            return false;
                        }

                        if(typeof e[filter.type] === 'object' &&  !e[filter.type].includes(filter.filter)){
                            return false;
                        }

                        if(typeof e[filter.type] === 'string' && e[filter.type] !== filter.filter){
                            return false;
                        }

                    }

                    return true;
                
            })
        }

        defineFilters(data){

            for (let jobItem of data){

                let filtersList = [ new Filter("role", jobItem.role), new Filter("level", jobItem.level)];
                
                if(jobItem.languages){
                    filtersList = filtersList.concat(jobItem.languages.map(e => {
                        return new Filter("languages", e);
                    }));
                }
    
                if(jobItem.tools){
                    filtersList = filtersList.concat(jobItem.tools.map(e=>{
                        return new Filter("tools", e);
                    }));
                }

                jobItem['filters'] = filtersList;
            }

            return data;
        }


    }

    class View{

        constructor(){

            /* Filters */
            
            this.filtersBar = this.getElement("#filters-bar");
            this.filterslist = this.createElement("ul","line-list");

            this.clearFilters = this.createElement("span", "filters-bar--clear-filters");
            this.clearFilters.append("Clear");

            this.filtersBar.append(this.filterslist, this.clearFilters);
            
            /* job Jisting */

            this.jobListing = this.getElement("#main");

        }

        renderFilters(filters){

            while(this.filterslist.firstChild){
                this.filterslist.removeChild(this.filterslist.firstChild);
            }

            if(filters.length === 0){
                this.filtersBar.classList.add("is-visible");
            } else {
                this.filtersBar.classList.remove("is-visible");
                for(let filter of filters){

                    let li = this.createElement("li","filteritem");
                    let spanLabel = this.createElement("span","filteritem-label");
                    let spanClose = this.createElement("span","filteritem-close");
                    spanLabel.append(filter.filter);
                    li.append(spanLabel,spanClose);
                    this.filterslist.append(li);
                }

            }

        }


        renderJobListing(jobs){

            while(this.jobListing.firstChild){
                this.jobListing.removeChild(this.jobListing.firstChild);
            }

            if(jobs.length === 0){
                this.jobListing.classList.toggle("is-visible");
                return;
            } 

            let fragment = document.createDocumentFragment();
        
            for (let jobItem of jobs){
                    
                let elemJobItem = this.createElement("div","job-item");
                
                if(jobItem.new){
                    elemJobItem.classList.add("job-item-new");
                }
    
                if(jobItem.featured){
                    elemJobItem.classList.add("job-item-featured");
                }
    
                let elemJobItemLogo = this.createElement("div","job-item--logo");
    
                let elemLogoImg =  document.createElement("img");
                elemLogoImg.setAttribute("src", jobItem.logo);
                
                elemJobItemLogo.appendChild(elemLogoImg);
    
                let elemJobItemMain = this.createElement("div", "job-item--main");
    
                let elemH2 =  document.createElement("h2");
                elemH2.append(jobItem.company);
                elemJobItemMain.append(elemH2);
    
                let elemSpan =  this.createElement("span", "job-item--main--bages");
                elemJobItemMain.append(elemSpan);
                
                let elemH1 =  document.createElement("h1");
                elemH1.append(jobItem.position);
                
                elemJobItemMain.append(elemH1);
    
                let listDetails = document.createElement("ul");
                listDetails.classList.add("line-list", "details");
    
                let liPostedAt =  document.createElement("li");
                liPostedAt.append(jobItem.postedAt);
    
                let liContract =  document.createElement("li");
                liContract.append(jobItem.contract);
    
                let liLocation =  document.createElement("li");
                liLocation.append(jobItem.location);
    
                listDetails.append(liPostedAt,liContract,liLocation);
                
                elemJobItemMain.append(listDetails);
    
                let elemJobItemFilters = this.createElement("div", "job-item--filters");
    
                elemJobItemFilters.append(createList(jobItem.filters));
                
                elemJobItem.append(elemJobItemLogo,elemJobItemMain,elemJobItemFilters)
                
                fragment.append(elemJobItem);
            }
        
            this.jobListing.appendChild(fragment);


            function createList(arr){

                if(!arr){
                    return; 
                }
        
                let ul = document.createElement("ul");
                ul.classList.add("line-list");
        
                arr.forEach(e => {
                    let li = document.createElement("li");
                    li.classList.add("filteritem");
                
                    let span  = document.createElement("span");
                    span.setAttribute("data-filter-type", e.type);
                    span.classList.add("filteritem-label");
                    span.append(e.filter)

                    li.append(span);
                    ul.appendChild(li);
                });
        
                return ul;
            }

        }

        bindAddFilter(handler){
            this.jobListing.addEventListener("click", e => {
                
                if(e.target.className === "filteritem-label"){
                    console.log(e.target.dataset.filterType,e.target.innerText);
                    handler(new Filter(e.target.dataset.filterType, e.target.innerText));
                }
            })
        }

        bindRemoveFilter(handler){
  
            this.filterslist.addEventListener("click", e => {
                if(e.target.className === "filteritem-close"){
                    handler(new Filter(e.target.dataset.filterType,e.target.previousElementSibling.innerText));
                }
            })
        }

        bindClearFilters(handler){
            this.clearFilters.addEventListener("click", e => {
                handler();
            })
        }

        createElement(tagName, className){

            let element = document.createElement(tagName);

            if(className){
                element.classList.add(className);
            }

            return element;

        }

        getElement(selector){
            return document.querySelector(selector)
        }
    }

    class Controller{

        constructor(model, view){

            this.model = model;
            this.view = view;

            this.onChange(this.model.filtersList, this.model.jobList);

            this.view.bindAddFilter(this.handleAddFilter.bind(this));
            this.view.bindRemoveFilter(this.handleRemoveFilter.bind(this));
            this.view.bindClearFilters(this.handleClearAll.bind(this));

            this.model.bindFiltersChanged(this.onChange.bind(this));

        }

        onChange(filters, jobs){
           
            this.view.renderFilters(filters);
            this.view.renderJobListing(jobs);
        }

        handleAddFilter(filter){
            this.model.addFilter(filter);
        }

        handleRemoveFilter(filter){
            this.model.removeFilter(filter);
        }

        handleClearAll(){
            this.model.clearFilters();
        }
    }


    /* 
    
    */

    class Filter{
        constructor(type, filter){
            this.type = type;
            this.filter = filter;
        }
    }
