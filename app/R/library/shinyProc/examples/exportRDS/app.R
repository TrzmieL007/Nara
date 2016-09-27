
library(shiny)
library(shinyProc)
library(ggplot2)

ui <- shinyUI(fluidPage(
   
   titlePanel("Read RDS"),
   
   sidebarLayout(
      sidebarPanel(
        exportRDSUI("data", doneButtonTitle = "Download data!"),
        exportRDSUI("plot", doneButtonTitle = "Download plot!")
      ),
      
      # Show a plot of the generated distribution
      mainPanel(
         plotOutput("distPlot")
      )
   )
))


getDt = function() return(iris)
getPlot = function()
{
  qplot(mpg, wt, data = mtcars)
}

server <- shinyServer(function(input, output) {
   
  callModule(makeExportRDS, id = "data", getDt) 
  callModule(makeExportRDS, id = "plot", getPlot) 
})

# Run the application 
shinyApp(ui = ui, server = server)

